var SerialPort = require('serialport');
var Promise = require('promise');
var CCCommand = require('./command');
var defaults = require('defaults-deep');
var timeout = require('promise-timeout').timeout;

function CCBus(port, config)
{
  this.config = defaults(config, { src: 1, timeout: 1000 });
  this.parser = this.parser.bind(this);
  this.ser = new SerialPort(port, { baudRate: 9600, parser: this.parser });
  this.connectionStatus = 'closed';
  
  this.parserBuffer = new Uint8Array(255+5);
  this.parserBuffer.cursor = 0;
  
  this.onOpen = this.onOpen.bind(this);
  this.ser.on('open', this.onOpen);
  
  this.onData = this.onData.bind(this);
  this.ser.on('data', this.onData);
  
  this.onClose = this.onClose.bind(this);
  this.ser.on('close', this.onClose);
  
  this.onError = this.onError.bind(this);
  this.ser.on('error', this.onError);
  
  this.devices = {};
  
  this.lastCommand = null;
  this.commandChainPromise = Promise.resolve();
}

CCBus.prototype =
{
  parser: function parser(emitter, buffer)
  {
    this.parserBuffer.set(buffer, this.parserBuffer.cursor);
    this.parserBuffer.cursor += buffer.length;
    while(this.parserBuffer.cursor > 1 && this.parserBuffer.cursor >= this.parserBuffer[1] + 5)
    {
      // full frame accumulated
      var length = this.parserBuffer[1] + 5;
      //console.log("length", length);
      
      //copy command from the buffer
      var frame = new Uint8Array(length);
      frame.set(this.parserBuffer.slice(0, length));
      
      // copy remaining buffer to the begin of the buffer to prepare for next command
      this.parserBuffer.set(this.parserBuffer.slice(length, this.parserBuffer.cursor));
      this.parserBuffer.cursor -= length;
      
      emitter.emit('data', new CCCommand(frame));
    }
  },
  
  forEachDevice: function forEachDevice(callback)
  {
    var dests = Object.keys(this.devices);
    dests.forEach(function(dest)
    {
      callback(this.devices[dest]);
    }.bind(this));
  },
  
  onOpen: function onOpen()
  {
    this.forEachDevice(function(device)
    {
      device.onBusReady();
    }.bind(this));
  },
  
  onData: function onData(command)
  {
    //console.log('data', command);
    if(command.dest != this.config.src)
      return;
    
    var device = this.devices[command.src];
    
    if(device)
    {
      device.onData(command);
    }
    
    if(this.lastCommand)
    {
      var lastCommand = this.lastCommand;
      this.lastCommand = null;
      
      if(command.command == 0)
        lastCommand.resolve(command);
      else
        lastCommand.reject(command);
    }
  },
  
  onClose: function onClose()
  {
    this.forEachDevice(function(device)
    {
      device.onBusClosed();
    }.bind(this));
  },
  
  onError: function onError(err)
  {
    console.log("Serial port error", err);
  },
  
  registerDevice: function registerDevice(device)
  {
    this.devices[device.config.dest] = device;
    if(this.ser.isOpen())
    {
      device.onBusReady();
    }
  },
  
  sendRawCommand: function sendCommand(command)
  {
    return new Promise(function(resolve, reject)
    {
      //console.log("will send command");
      command.src = this.config.src;
      this.ser.write(command.toBuffer(), function(err)
      {
        //console.log("have sent command");
        if(err)
          return reject(err);
        return resolve();
      });
    }.bind(this));
  },
  
  sendCommand: function sendCommand(command)
  {
    // Send command with promised reply
    // If you use this function, use it exclusively and don't forget to call _onData() if you override onData()
    
    var promise = timeout(new Promise(function(resolve, reject)
    {
      command.resolve = resolve;
      command.reject = reject;
    }.bind(this)), this.config.timeout);
    
    // use the command chain to send command only when previous commands have finished
    // this way replies can be correctly attributed to commands
    this.commandChainPromise = this.commandChainPromise
    .catch(function() {})
    .then(function()
    {
      this.lastCommand = command;
      return this.sendRawCommand(command);
    }.bind(this))
    .then(function() { return promise; });
    
    return promise;
  },
};

module.exports = exports = CCBus;
