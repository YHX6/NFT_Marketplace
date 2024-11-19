// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {NFTCollection} from "../contracts/NFTCollection.sol";

contract DeployNFTCollection is Script {
    // Default run function required by Forge
    function run() external returns (NFTCollection) {
        // Default values for testing deployment
        return deployCollection(
            "Test NFT Collection",
            "TEST",
            "ipfs://test-uri/",
            "Test collection description",
            1000
        );
    }

    // Helper function for deploying with specific parameters
    function deployCollection(
        string memory name,
        string memory symbol,
        string memory baseURI,
        string memory description,
        uint256 maxSupply
    ) public returns (NFTCollection) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        NFTCollection nftCollection = new NFTCollection(
            name,
            symbol,
            baseURI,
            description,
            maxSupply,
            msg.sender          // Owner will be the deployer
        );

        vm.stopBroadcast();
        
        return nftCollection;
    }
}