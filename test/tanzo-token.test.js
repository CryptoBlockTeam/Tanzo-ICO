const assertRevert = require("./helpers/assertRevert");
const debug = require("debug")("tanzo");
const util = require("./util.js");

const TanzoToken = artifacts.require("TanzoTokenMock");

const TOTAL_SUPPLY = 500000000 * (10 ** 18);
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract("TanzoToken", function(accounts) {

  before(() => util.measureGas(accounts));
  after(() => util.measureGas(accounts));

  const eq = assert.equal.bind(assert);
  const owner = accounts[0];
  const acc1 = accounts[1];
  const acc2 = accounts[2];

  const gasPrice = 1e11;
  const logEvents= [];
  const pastEvents = [];

  let tanzo;

  async function deploy() {
    tanzo = await TanzoToken.new();

    // transfer ownership
    await tanzo.setLimits(0, 1000);
    await tanzo.transferOwnership(owner);
    await tanzo.claimOwnership({from: owner});

    const eventsWatch  = tanzo.allEvents();
    eventsWatch .watch((err, res) => {
      if (err) return;
      pastEvents.push(res);
      debug(">>", res.event, res.args);
    });

    logEvents.push(eventsWatch);
  }

  after(function() {
    logEvents.forEach(ev => ev.stopWatching());
  });

  describe("Initial state", function() {
    before(deploy);

    it("shoould own contract", async function() {
      const ownerAddress = await tanzo.owner();
      eq(ownerAddress, owner);

      const tokenCount = await tanzo.totalSupply();
      eq(tokenCount.toNumber(), TOTAL_SUPPLY);
    });
  });

  describe('Balance', function() {
    before(deploy);

    describe('when requested account has tokens', function() {
      it('returns amount of tokens', async function() {
        const balance = await tanzo.balanceOf(owner);
        eq(balance.toNumber(), TOTAL_SUPPLY);
      })
    });

    describe('when requested account has no tokens', function() {
      it('returns zero tokens', async function() {
        const balance = await tanzo.balanceOf(acc1);
        eq(balance.toNumber(), 0);
      });
    });
  });

  describe('Transfer', function() {
    before(deploy);

    describe('when the recipient is not the zero address', function () {
      const to = acc2;

      describe('when the sender does not have enough balance', function () {
        const amount = 1;

        it('reverts', async function () {
          await assertRevert(tanzo.transfer(to, amount, { from: acc1 }));
        });
      });

      describe('when the sender has enough balance', function () {
        const amount = 100;

        it('transfers the requested amount', async function () {
          await tanzo.transfer(to, amount, { from: owner });

          const senderBalance = await tanzo.balanceOf(owner);
          eq(senderBalance, TOTAL_SUPPLY - amount);

          const recipientBalance = await tanzo.balanceOf(to);
          eq(recipientBalance, amount);
        });

        it('emits a transfer event', async function () {
          const { logs } = await tanzo.transfer(to, amount, { from: owner });

          eq(logs.length, 1);
          eq(logs[0].event, 'Transfer');
          eq(logs[0].args.from, owner);
          eq(logs[0].args.to, to);
          assert(logs[0].args.value.eq(amount));
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const to = ZERO_ADDRESS;

      it('reverts', async function () {
        await assertRevert(tanzo.transfer(to, 100, { from: owner }));
      });
    });
  })

  describe('Approve', function () {
    before(deploy);

    describe('when the spender is not the zero address', function () {
      const spender = acc2;

      describe('when the sender has enough balance', function () {
        const amount = 100;

        it('emits an approval event', async function () {
          const { logs } = await tanzo.approve(spender, amount, { from: owner });

          eq(logs.length, 1);
          eq(logs[0].event, 'Approval');
          eq(logs[0].args.owner, owner);
          eq(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(amount));
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await tanzo.approve(spender, amount, { from: owner });

            const allowance = await tanzo.allowance(owner, spender);
            eq(allowance, amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await tanzo.approve(spender, 1, { from: owner });
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await tanzo.approve(spender, amount, { from: owner });

            const allowance = await tanzo.allowance(owner, spender);
            eq(allowance, amount);
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = 101;

        it('emits an approval event', async function () {
          const { logs } = await tanzo.approve(spender, amount, { from: owner });

          eq(logs.length, 1);
          eq(logs[0].event, 'Approval');
          eq(logs[0].args.owner, owner);
          eq(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(amount));
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await tanzo.approve(spender, amount, { from: owner });

            const allowance = await tanzo.allowance(owner, spender);
            eq(allowance, amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await tanzo.approve(spender, 1, { from: owner });
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await tanzo.approve(spender, amount, { from: owner });

            const allowance = await tanzo.allowance(owner, spender);
            eq(allowance, amount);
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      const amount = 100;
      const spender = ZERO_ADDRESS;

      it('approves the requested amount', async function () {
        await tanzo.approve(spender, amount, { from: owner });

        const allowance = await tanzo.allowance(owner, spender);
        eq(allowance, amount);
      });

      it('emits an approval event', async function () {
        const { logs } = await tanzo.approve(spender, amount, { from: owner });

        eq(logs.length, 1);
        eq(logs[0].event, 'Approval');
        eq(logs[0].args.owner, owner);
        eq(logs[0].args.spender, spender);
        assert(logs[0].args.value.eq(amount));
      });
    });
  });

  describe('Transfer from', function () {
    before(deploy);

    const spender = acc1;

    describe('when the recipient is not the zero address', function () {
      const to = acc2;

      describe('when the spender has enough approved balance', function () {
        beforeEach(async function () {
          await tanzo.approve(spender, 100, { from: owner });
        });

        describe('when the owner has enough balance', function () {
          const amount = 100;

          it('transfers the requested amount', async function () {
            await tanzo.transferFrom(owner, to, amount, { from: spender });

            const senderBalance = await tanzo.balanceOf(owner);
            eq(senderBalance, TOTAL_SUPPLY - amount);

            const recipientBalance = await tanzo.balanceOf(to);
            eq(recipientBalance, amount);
          });

          it('decreases the spender allowance', async function () {
            await tanzo.transferFrom(owner, to, amount, { from: spender });

            const allowance = await tanzo.allowance(owner, spender);
            assert(allowance.eq(0));
          });

          it('emits a transfer event', async function () {
            const { logs } = await tanzo.transferFrom(owner, to, amount, { from: spender });

            eq(logs.length, 1);
            eq(logs[0].event, 'Transfer');
            eq(logs[0].args.from, owner);
            eq(logs[0].args.to, to);
            assert(logs[0].args.value.eq(amount));
          });
        });

        describe('when the owner does not have enough balance', function () {
          const amount = 101;

          it('reverts', async function () {
            await assertRevert(tanzo.transferFrom(owner, to, amount, { from: spender }));
          });
        });
      });

      describe('when the spender does not have enough approved balance', function () {
        beforeEach(async function () {
          await tanzo.approve(spender, 99, { from: owner });
        });

        describe('when the owner has enough balance', function () {
          const amount = 100;

          it('reverts', async function () {
            await assertRevert(tanzo.transferFrom(owner, to, amount, { from: spender }));
          });
        });

        describe('when the owner does not have enough balance', function () {
          const amount = 101;

          it('reverts', async function () {
            await assertRevert(tanzo.transferFrom(owner, to, amount, { from: spender }));
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const amount = 100;
      const to = ZERO_ADDRESS;

      beforeEach(async function () {
        await tanzo.approve(spender, amount, { from: owner });
      });

      it('reverts', async function () {
        await assertRevert(tanzo.transferFrom(owner, to, amount, { from: spender }));
      });
    });
  });

  describe('Claim lost token', function() {
    before(deploy);

    describe('when tokens are transfered to contract\'s address', async function() {
      const amount = 100;

      before(async function() {
        const to = tanzo.address;
        await tanzo.transfer(to, amount, {from: owner});
      });

      it('should return the tokens to the owner', async function() {
        const to = await tanzo.address;

        await tanzo.claimTokens(to, owner);

        const recipientBalance = await tanzo.balanceOf(owner);
        eq(recipientBalance.toNumber(), TOTAL_SUPPLY);
      })
    })
  });
});
