module.exports =
{
  CCCommand: require('./command'),
  CCBus: require('./bus'),
  CCDevice: require('./device'),
  CoinDetector: require('./coindetector')
};

var cd = new module.exports.CoinDetector('/dev/ttyUSB0');
