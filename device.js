var Promise = require('promise');
var CCBus = require('./bus');
var CCCommand = require('./command');
var defaults = require('defaults-deep');
var timeout = require('promise-timeout').timeout;

function CCDevice(bus, config)
{
  if(!bus && !config) // initialize prototype only
    return;
  
  if(typeof bus == 'string')
   this.bus = new CCBus(bus, config);
  else
    this.bus = bus;
  
  this.config = defaults(config, { dest: 2 });
  this.lastCommand = null;
  this.commandChainPromise = Promise.resolve();
}

CCDevice.prototype =
{
  onBusReady: function onBusReady()
  {
    console.log("Warn: CCTalk device proxy doesn't override onBusReady()");
  },
  
  _onData: function _onData(command)
  {
    // Call this function in onData() to use the promised reply functionality.
    
    // Because we guarantee correct command order in sendCommand(), we can safely assume this
    // is really the reply to lastCommand
    //console.log("received reply");
    var lastCommand = this.lastCommand;
    this.lastCommand = null;
    
    if(command.command == 0)
      lastCommand.resolve(command);
    else
      lastCommand.reject(command);
  },
  
  onData: function onData(command)
  {
    // If you override this function you won't able to use the promised reply functionality.
    // If you need to override onData(), you can call the prefixed _onData() in you own code.
    this._onData(command);
  },
  
  sendCommand: function sendCommand(command)
  {
    // Send command with promised reply
    // If you use this function, use it exclusively and don't forget to call _onData() if you override onData()
    
    var promise = timeout(new Promise(function(resolve, reject)
    {
      command.resolve = resolve;
      command.reject = reject;
    }.bind(this)), 1000);
    
    // use the command chain to send command only when previous commands have finished
    // this way replies can be correctly attributed to commands
    this.commandChainPromise = this.commandChainPromise
    .catch(function() {})
    .then(function()
    {
      command.dest = this.config.dest;
      this.lastCommand = command;
      return this.bus.sendCommand(command);
    }.bind(this))
    .then(function() { return promise; });
    
    return promise;
  },
  
  onBusClosed: function onBusClosed()
  {
    console.log("Warn: CCTalk device proxy doesn't override onBusClosed()");
  }
};

CCDevice.commands =
{
  simplePoll: 254,
  addressPoll: 253,
  addressClash: 252,
  addressChange: 251,
  addressRandom: 250
};

module.exports = exports = CCDevice;
