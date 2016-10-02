var Promise = require('promise');
var CCCommand = require('./command');
var CCDevice = require('./device');

function CoinDetector(bus, config)
{
  CCDevice.apply(this, arguments);
  
  this.poll = this.poll.bind(this);
  
  this.eventBuffer = new Uint8Array(11);
  
  // register last, after all device type specific variables have been set up!
  this.bus.registerDevice(this);
}

CoinDetector.prototype = new CCDevice();

CoinDetector.prototype.onBusReady = function onBusReady()
{
  console.log('port open');
  /*
  this.sendCommand(new CCCommand(this.config.src, this.config.dest, 254, new Uint8Array(0)))
    .then(function(reply)
    {
      console.log("Simple poll ok!");
      return this.sendCommand(new CCCommand(this.config.src, this.config.dest, 231, new Uint8Array(2).fill(0xFF)));
    }.bind(this))
    .then(function(reply)
    {
      console.log("inhibitor mask ok!");
      return this.sendCommand(new CCCommand(this.config.src, this.config.dest, 228, new Uint8Array(1).fill(0xFF)));
    }.bind(this))
    .then(function(reply)
    {
      console.log("inhibitor master ok!");
      this.sendCommand(new CCCommand(this.config.src, this.config.dest, 222, new Uint8Array(2).fill(0x0F)));
      setInterval(this.poll, 300);
    }.bind(this))
    .then(function(reply)
    {
      console.log("kassensteuerung ok!");
    }.bind(this));
  */
  
  this.sendCommand(new CCCommand(this.config.src, this.config.dest, 254, new Uint8Array(0)));
  this.sendCommand(new CCCommand(this.config.src, this.config.dest, 231, new Uint8Array(2).fill(0xFF)));
  this.sendCommand(new CCCommand(this.config.src, this.config.dest, 228, new Uint8Array(1).fill(0xFF))).then(function(reply)
  {
    setInterval(this.poll, 300);
  }.bind(this));
  this.sendCommand(new CCCommand(this.config.src, this.config.dest, 222, new Uint8Array(2).fill(0x0F)));
};
  
CoinDetector.prototype.poll = function poll()
{
  this.sendCommand(new CCCommand(this.config.src, this.config.dest, 229, new Uint8Array(0)))
  .then(function(reply)
  {
    if(reply.data[0] != this.eventBuffer[0])
      console.log("Event buffer changed", reply);
    this.eventBuffer = reply.data;
  }.bind(this));
};

CoinDetector.commands =
{
  requestStatus: 248,
  requestVariableSet: 247,
  requestManufacturerId: 246,
  requestEquipmentCategoryId: 245,
  requestProductCode: 244,
  requestDatabaseVersion: 243,
  requestSerialNumber: 242,
  requestSoftwareRevision: 241,
  testSolenoids: 240,
  testOutputLines: 238,
  readInputLines: 237,
  readOptoStates: 236,
  latchOutputLines: 233,
  performSelfCheck: 232,
  modifyInhibitStatus: 231,
  requestInhibitStatus: 230,
  readBufferedCredit: 229,
  requestMasterInhibitStatus: 227,
  requestInsertionCounter: 226,
  requestAcceptCounter: 225,
  modifySorterOverrideStatus: 222,
  requestSorterOverrideStatus: 221,
  requestDataStorageAvailability: 216,
  requestOptionFlags: 213,
  requestCoinPosition: 212,
  modifySorterPath: 210,
  requestSorterPath: 209,
  teachModeControl: 202,
  requestTeachStatus: 201,
  requestCreationDate: 196,
  requestLastModificationDate: 195,
  requestRejectCounter: 194,
  requestFraudCounter: 193,
  requestBuildCode: 192,
  modifyCoinId: 185,
  requestCoinId: 184,
  uploadWindowData: 183,
  downloadCalibrationInfo: 182,
  requestThermistorReading: 173,
  requestBaseYear: 170,
  requestAddressMode:169,
  requestCommsRevision: 4,
  clearCommsStatusVariables: 3,
  requestCommsStatusVariables: 2,
  resetDevice: 1
};

CoinDetector.eventCodes =
{
  254: 'return',
  20: 'string',
  19: 'slow',
  13: 'busy',
  8: 'following',
  2: 'inhibited',
  1: 'rejected'
};

module.exports = exports = CoinDetector;
