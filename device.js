var Promise = require('promise');
var CCBus = require('./bus');
var CCCommand = require('./command');
var defaults = require('defaults-deep');

function CCDevice(bus, config)
{
  if(!bus && !config) // initialize prototype only
    return;
  
  if(typeof bus == 'string')
   this.bus = new CCBus(bus, config);
  else
    this.bus = bus;
  
  this.config = defaults(config, { dest: 2 });
}

CCDevice.prototype =
{
  onBusReady: function onBusReady()
  {
    console.log("Warn: CCTalk device proxy doesn't override onBusReady()");
  },
  
  onData: function onData(command)
  {
    // Don't do anything by default
  },
  
  onBusClosed: function onBusClosed()
  {
    console.log("Warn: CCTalk device proxy doesn't override onBusClosed()");
  },
  
  sendCommand: function sendCommand(command)
  {
    command.dest = this.config.dest;
    return this.bus.sendCommand(command);
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
