// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {Ping} from "../src/Ping.sol";

contract PingScript is Script {

    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        vm.stopBroadcast();
    }
}
