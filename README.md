Node Library to interface coin detectors and other peripheral devices speaking the ccTalk protocol
==================================================================================================

This library aims to provide support for various peripheral devices that use the ccTalk protocol
over a serial line or serial line emulation over USB. It's primary target is the EMP800 by
wh Münzprüfer Berlin. 

At the moment this is very much a work in progress.

API
---

The API is object oriented and uses several proxy objects to model parts of the physical hardware.

### Types

#### CCBus

A bus object is used to interface devices that share a common data line. It stores the host
configuration and can be explicitely or implicitely constructed (if only one device is used).

##### new CCBus(port, config)

Constructs a new bus object.

Arguments:
- port: a string describing the serial port to use, e.g. "COM1" on Windows or "/dev/ttyS0" on Linux.
- config: a object with the initial host configuration. It can take the following properties:
  - src: the host addres to use (default: 1)
  - timeout: the amount of milliseconds to wait for the reply to a command by default (default: 1000)

##### ccBus.registerDevice(device)

Adds a device to the internal list of devices managed by this host.

Argument:
- device: a device object to register (must implement the CCDevice API)

##### ccBus.sendCommand(command)

Sends a command to the bus and waits for a reply.

Argument:
- command: a command object to send (must implement the CCCommand API). command.src will be set to the
host address configured upon construction of the bus.
Returns:
- A promise that will fulfill with the reply from the device (as a ccCommand) as soon as it has been received,
or be rejected with a serial port error or timeout error.

##### ccBus.sendRawCommand(command)

Sends a command to the bus without waiting for previous commands to be sent or the reply from the device. Mostly
for internal use.

Argument:
- command: a command object to send (must implement the CCCommand API). command.src will be set to the
host address configured upon construction of the bus.
Returns:
- a promise that will fulfill when the command has been sent to the bus but before an actual reply has
been received or will be rejected with a serial port error.

#### CCCommand

An object describing data sent to a devices or received from a device.

##### new CCCommand(src, dest, command, data)

Constructs a new command object from parameters.

Arguments:
- src: The sender address to use (default: 1).
- dest: The recipient address to use (default: 2).
- command: The command header to send.
- data: a Uint8Array holding additional command data.

##### new CCCommand(buffer)

Parses a new command object from raw data.

Arguments:
- buffer: an Uint8Array to parse.

##### ccCommand.toBuffer()

Converts the command to raw data.

Returns:
- a Uint8Array holding raw data that describe the command.

#### CCDevice

An object describing a generic device. It can be used to implement more high-level device proxies.

##### new CCDevice(bus, config)

Constructs a new device proxy. Optionally also create a new bus object.

Arguments:
- bus: either a bus object (implementing the CCBus API) or a string describing the serial port, in which
case a new bus object will be create automatically.
- config: an object with the initial device configuration. It can take the following properties:
  - dest: the device address to use (default: 2)
  - src: the host addres to use in case a bus object is created (default: 1)
  - timeout: the amount of milliseconds to wait for the reply to a command by default (default: 1000)

The constructor will store the bus to use in ccDevice.bus but will not call ccDevice.bus.registerDevice() yet,
as additional set-up needs to be done before a raw ccDevice object can be used.

##### new CCDevice()

Constructs a new ccDevice object to use as a prototype for the implementation of a  proxy object for
specific device types.

##### ccDevice.onBusReady()

Called by the bus object when the serial interface is open.

##### ccDevice.onData(command)

Called by the bus object when a reply has been received from the device.

Arguments:
- command: The data sent by the device as a ccCommand.

##### ccDevice.onBusClosed()

Called by the bus object after the serial port has been closed.

##### ccDevice.sendCommand(command)

High-level API to send commands and receive replies.

Arguments:
- command: The command to send (must implement CCCommand API). command.dest will be set to the device's address.
Returns:
- A promise that will fulfill with the reply from the device (as a ccCommand) as soon as it has been received.

#### CoinDetector

Finally something useful! Implements a coin acceptor.

**TODO** Document API

Disclaimer
----------

ccTalk may be a registered trademark of Money Controls or Crane Payment Innovations.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
