pragma solidity ^0.4.23;

import "./lib/token/ERC20Basic.sol";
import "./lib/token/StandardToken.sol";
import "./lib/ownership/DelayedClaimable.sol";

contract TanzoToken is StandardToken, DelayedClaimable {

  string public constant name = "Tanzo Token";
  string public constant sybbol = "TZO";
  uint8 public constant decimals = 8;

  uint256 public constant INITIAL_SUPPLY = 500000000 * (10 ** uint256(decimals));

  constructor() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);
  }

  /**
   * @dev Used to claim tokens send to wrong address
   * @param _token The address that holds the tokens.
   * @param _to The address that is claiming ownership of tokens.
   */
  function claimTokens(address _token, address _to) onlyOwner public returns (bool) {
    if (_token == 0x0) {
      owner.transfer(address(this).balance);
      return;
    }

    ERC20Basic token = ERC20Basic(_token);
    uint256 balance = token.balanceOf(this);
    if (token.transfer(_to, balance)) {
      emit Transfer(_token, _to, balance);
      return true;
    }
    return false;
  }
}
