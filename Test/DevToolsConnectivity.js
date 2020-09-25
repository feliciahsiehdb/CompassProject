# Connectivity debug scripts for TSEs and customers

What follows is a script to debug connectivity
and isolate the root cause of issues directly in the environments of customers.

## Usage
1. Open `DevTools` in compass.
2. Copy/paste the script below in the console.
3. Run one of the available test, ie. `connectivityTests.testNativeDriverUri('mongodb://localhost:27017')`.
4. Wait for the test to print `"Done. Test succeeded."`. If that message is not printed the connection was not established correctly.

### Available tests

#### `testConnectionModelUri(connectionString)`
Tests the connection simulating the process happening in Compass when connecting with a connection string.
##### Usage & Examples

``` js
connectivityTests.testConnectionModelUri('mongodb://localhost:27017')`;
```

#### `testConnectionModelAttributes(attributes)`
Tests the connection simulating the process happening in Compass when connecting with form parameters.
#### Usage & Examples

Basic standalone server:

``` js
connectivityTests.testConnectionModelAttributes({
  "isSrvRecord": false,
  "hostname": "localhost",
  "port": 27017,
  "hosts": [
    {
      "host": "localhost",
      "port": 27017
    }
  ],
  "authStrategy": "NONE"
});

```​
Kerberos:
``` js
connectivityTests.testConnectionModelAttributes({
  "isSrvRecord": false,
  "hostname": "<server hostname>",
  "port": <server port>,
  "hosts": [
    {
      "host": "<server hostname>",
      "port": <server port>
    }
  ],
  "authStrategy": "KERBEROS",
  "kerberosServiceName": "<kerberos service name>",
  "kerberosPrincipal": "<kerberos principal>",
  "kerberosCanonicalizeHostname": false
});
```
LDAP:
``` js
connectivityTests.testConnectionModelAttributes({
  "isSrvRecord": false,
  "hostname": "<server hostname>",
  "port": <server port>,
  "hosts": [
    {
      "host": "<server hostname>",
      "port": <server port>
    }
  ],
  "authStrategy": "LDAP",
  "ldapUsername": "<ldap username>",
  "ldapPassword": "<ldap password>"
});
```
#### `testNativeDriverUri(connectionString, driverOptions)`
Tests the connection using the same node.js driver and default options as the Compass does. Default driver options are: 
``` js
{
  connectWithNoPrimary: true,
  readPreference: "primary",
  useNewUrlParser: true,
  useUnifiedTopology: true
}
```
##### Usage & Examples
``` js
connectivityTests.testNativeDriverUri('mongodb://localhost:27017')`;
```
Overriding driver options:
``` js
connectivityTests.testNativeDriverUri('mongodb://localhost:27017', { useUnifiedTopology: false })`;
```
## Script
``` js
connectivityTests = (() => {
  const util = require('util');
  const { MongoClient } = require('mongodb');
  const Connection = require('mongodb-connection-model');

  const connectionModelFromUri = util.promisify(Connection.from.bind(Connection));
  const connectWithConnectionModel = util.promisify(Connection.connect.bind(Connection));

  async function testAndCloseClient(client) {
    console.log('connected')
    console.log('testing commands ...');
    try {
      await client.db().command({ connectionStatus: 1 });
      console.log('Done. Test succeeded.');
    } catch (e) {
      console.log('Error', e);
    } finally {
      if (!client) {
        return;
      }
      await client.close();
    }
  }
  async function testConnectionModelAttributes(attributes) {
    const connectionModel = new Connection(attributes);
    console.log('Connecting ...');
    const client = await connectWithConnectionModel(connectionModel, () => { });
    await testAndCloseClient(client);
  }

  async function testConnectionModelUri(uri) {
    const connectionModel = await connectionModelFromUri(uri);
    console.log('Connecting ...');
    const client = await connectWithConnectionModel(connectionModel, () => { });
    await testAndCloseClient(client);
  }

  async function testNativeDriverUri(uri, driverOptions = {}) {
    driverOptions = {
      connectWithNoPrimary: true,
      readPreference: "primary",
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...driverOptions
    };

    console.log('Connecting ...');
    const client = await MongoClient.connect(uri, driverOptions);

    await testAndCloseClient(client);
  }
  return {
    testConnectionModelAttributes,
    testConnectionModelUri,
    testNativeDriverUri
  };
})();
