// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/NFTCollection.sol";

contract NFTCollectionTest is Test {
    NFTCollection public nftCollection;
    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        vm.prank(owner);
        nftCollection = new NFTCollection(
            "Test Collection",
            "TEST",
            "ipfs://test-uri/",
            "Test collection description",
            100,
            owner
        );
    }

    function testMint() public {
        vm.startPrank(owner);
        uint256 tokenId = nftCollection.mint(user);
        assertEq(tokenId, 1);
        assertEq(nftCollection.ownerOf(tokenId), user);
        assertEq(nftCollection.totalMinted(), 1);
        vm.stopPrank();
    }

    function testFailMintNonOwner() public {
        vm.prank(user);
        nftCollection.mint(user);
    }

    function testBatchMint() public {
        vm.startPrank(owner);
        uint256 batchSize = 5;
        nftCollection.batchMint(user, batchSize);
        assertEq(nftCollection.totalMinted(), batchSize);
        for(uint256 i = 1; i <= batchSize; i++) {
            assertEq(nftCollection.ownerOf(i), user);
        }
        vm.stopPrank();
    }

    function testSetBaseURI() public {
        string memory newBaseURI = "ipfs://new-uri/";
        vm.prank(owner);
        nftCollection.setBaseURI(newBaseURI);
        
        vm.prank(owner);
        uint256 tokenId = nftCollection.mint(user);
        assertEq(nftCollection.tokenURI(tokenId), string(abi.encodePacked(newBaseURI, "1")));
    }
}