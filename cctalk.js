module.exports =
{
  CCCommand: require('./command'),
  CCBus: require('./bus'),
  CCDevice: require('./device'),
  CoinDetector: require('./coindetector')
};

if(!module.parent) // running this file as main
{
  var cd = new module.exports.CoinDetector('/dev/ttyUSB0');

  cd.on('error', function(e)
  {
    console.log(e);
  });

  cd.on('ready', function()
  {
    try
    {
      console.log('ready');
      cd.enableAcceptance();
      cd.setAcceptanceMask(0xFFFF);
      
      cd.on('error', function(e) { console.log('error', e); });
      cd.on('accepted', function(c)
      {
        console.log('Accepted', c);
        cd.getCoinName(c).then(function(name) { console.log(name); });
      });
      cd.on('inhibited', function(c)
      {
        console.log('Inhibited', c);
        cd.getCoinName(c).then(function(name) { console.log(name); });
      });
      cd.on('rejected', function(c) { console.log('Rejected', c); });
    }
    catch(e)
    {
      console.log(e, e.stack);
    }
  });
}
