var SerialPort = require('serialport');
var Promise = require('promise');
var CCCommand = require('./command');
var defaults = require('defaults-deep');

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
  
  this.devices = {};
  this.commandQueue = [];
}

CCBus.prototype =
{
  parser: function parser(emitter, buffer)
  {
    this.parserBuffer.set(buffer, this.parserBuffer.cursor);
    this.parserBuffer.cursor += buffer.length;
    if(this.parserBuffer.cursor > 1 && this.parserBuffer.cursor >= this.parserBuffer[1] + 5)
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
  },
  
  onClose: function onClose()
  {
    this.forEachDevice(function(device)
    {
      device.onBusClosed();
    }.bind(this));
  },
  
  registerDevice: function registerDevice(device)
  {
    this.devices[device.config.dest] = device;
    if(this.ser.isOpen())
    {
      device.onBusReady();
    }
  },
  
  sendCommand: function sendCommand(command)
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
  }
};

module.exports = exports = CCBus;
