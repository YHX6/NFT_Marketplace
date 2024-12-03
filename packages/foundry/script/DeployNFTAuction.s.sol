// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/NFTAuction.sol";

contract DeployNFTAuction is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        NFTAuction auction = new NFTAuction();
        console.log("NFTAuction deployed to:", address(auction));

        vm.stopBroadcast();
    }
}