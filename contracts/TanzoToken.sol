pragma solidity ^0.4.23;

import "./lib/token/ERC20Basic.sol";
import "./lib/token/StandardToken.sol";
import "./lib/ownership/DelayedClaimable.sol";

/**
 * @title Tanzo: The Blockchain-based social marketplace for handmade goods.
 * @author Tanzo team (https://tanzo.io)
 * @dev The Tanzo token smart contract based on ERC20
 */
contract TanzoToken is StandardToken, DelayedClaimable {

  // Set the token name
  string public constant name = "Tanzo Token";

  // Set the token symbol
  string public constant symbol = "TZO";

  // Define token decimals
  uint8 public constant decimals = 18;

  // Define the total token supply
  uint256 public constant TOTAL_SUPPLY = 500000000 * (10 ** uint256(decimals));

  /**
   * @notice Creates the TanzoToken smart contract instance
   */
  constructor() public {
    // Set token supply
    totalSupply_ = TOTAL_SUPPLY;

    // Transfer all tokens to the owner
    balances[msg.sender] = TOTAL_SUPPLY;

    // Emit transfer event
    emit Transfer(0x0, msg.sender, TOTAL_SUPPLY);
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
