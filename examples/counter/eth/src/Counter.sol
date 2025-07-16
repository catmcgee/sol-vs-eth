// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

/**
 * @title Counter Contract
 * @dev This contract demonstrates fundamental Solidity concepts through a simple counter implementation.
 */
contract Counter {
    uint256 public number;                          // @id:number @explain:Persistent storage slot holding the counter value

    /// Anyone may set an explicit value.
    function setNumber(uint256 newNumber) public {
        number = newNumber;                         // @id:set_write @explain:Write the supplied value into the storage slot
    }

    /// Increment by exactly 1 s   
    function increment() public {
        number++;                                   // @id:inc_write @explain: Adds 1 to number. Solidity 0.8.0+ does overflow checking autoamtically
    }
}
