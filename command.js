var Promise = require('promise');

function CCCommand(src, dest, command, data)
{
  if(src instanceof Uint8Array)
  {
    // parse command
    var buffer = src;
    this.src = buffer[2];
    this.dest = buffer[0];
    this.command = buffer[3];
    this.data = buffer.slice(4, buffer[1]+4);
    
    // TODO: checksum
  }
  else
  {
    // create command
    this.src = typeof src != undefined ? src : 1;
    this.dest = typeof dest != undefined ? dest : 2;
    this.command = command;
    this.data = data;
  }
}

CCCommand.prototype =
{
  toBuffer: function toBuffer()
  {
    var buffer = new Uint8Array(5 + this.data.length);
    buffer[0] = this.dest;
    buffer[1] = this.data.length;
    buffer[2] = this.src;
    buffer[3] = this.command;
    buffer.set(this.data, 4);
    
    var sum = 0;
		
		for (var i=0; i < (buffer.length - 1); ++i)
			sum += (buffer[i]);
		
		buffer[this.data.length+4] = 0x100 - sum%0x100;
		
		return buffer;
  }
};

module.exports = exports = CCCommand;
