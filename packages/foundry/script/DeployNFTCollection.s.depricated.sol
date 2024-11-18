// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {NFTCollection} from "../contracts/NFTCollection.sol";

contract DeployNFTCollection is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        NFTCollection nftCollection = new NFTCollection(
            "My NFT Collection", // name
            "MNFT",             // symbol
            "ipfs://your-base-uri/", // baseURI
            "My awesome NFT collection", // description
            1000,               // maxSupply
            msg.sender          // initialOwner
        );

        vm.stopBroadcast();
    }
}