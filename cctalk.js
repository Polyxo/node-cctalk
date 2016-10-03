module.exports =
{
  CCCommand: require('./command'),
  CCBus: require('./bus'),
  CCDevice: require('./device'),
  CoinDetector: require('./coindetector')
};

var cd = new module.exports.CoinDetector('/dev/ttyUSB0');
cd.on('error', function(e) { console.log('error', e); });
cd.on('accepted', function(c) { console.log('Accepted', c); });
cd.on('rejected', function(c) { console.log('Rejected', c); });
