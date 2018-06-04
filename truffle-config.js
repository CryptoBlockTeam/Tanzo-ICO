var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "one cook possible system olympic entire lava stage dust casual client member";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    mainnet: {
      host: 'localhost',
      port: 8546,
      network_id: 1,
      gas: 4500000,
      gasPrice: 10000000000
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/5BwKKArg3f1tu4Rk0LZD")
      },
      network_id: '3',
      gas: 4500000,
      gasPrice: 150000000000
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  mocha: {
    useColors: true
  }
};
