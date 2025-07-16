// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Ping { // @id:contract_def @explain:Solidity contract definition - holds both code and storage in a single on-chain account
    event Pong(address indexed caller); // @id:pong_event_def @explain:Event that will be emitted when ping() is called, storing caller's address in transaction logs

    function ping() external { // @id:ping_eth @explain:This is marked as external, so it can be called by other contracts. All Solana programs are effectively public/external
        emit Pong(msg.sender); // @id:pong_emit @explain:Emit the Pong event with the caller's address, similar to Solana's msg! logging
    }
}
