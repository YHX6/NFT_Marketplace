// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTAuction is ReentrancyGuard {
    struct Auction {
        address seller;
        uint256 tokenId;
        uint256 startingPrice;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool ended;
        IERC721 nftContract;
    }

    mapping(uint256 => Auction) public auctions;
    uint256 public auctionCount;
    uint256 public constant AUCTION_DURATION = 3 days;
    uint256 public constant MIN_BID_INCREMENT = 0.01 ether;

    event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 tokenId, uint256 startingPrice);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address winner, uint256 amount);

    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _startingPrice
    ) external returns (uint256) {
        require(_startingPrice > 0, "Starting price must be greater than 0");
        
        IERC721 nft = IERC721(_nftContract);
        require(nft.ownerOf(_tokenId) == msg.sender, "Not the NFT owner");
        require(nft.getApproved(_tokenId) == address(this), "Auction not approved");

        uint256 auctionId = auctionCount++;
        
        auctions[auctionId] = Auction({
            seller: msg.sender,
            tokenId: _tokenId,
            startingPrice: _startingPrice,
            endTime: block.timestamp + AUCTION_DURATION,
            highestBidder: address(0),
            highestBid: 0,
            ended: false,
            nftContract: IERC721(_nftContract)
        });

        nft.transferFrom(msg.sender, address(this), _tokenId);
        
        emit AuctionCreated(auctionId, msg.sender, _tokenId, _startingPrice);
        return auctionId;
    }

    function placeBid(uint256 _auctionId) external payable nonReentrant {
        Auction storage auction = auctions[_auctionId];
        
        require(!auction.ended, "Auction ended");
        require(block.timestamp < auction.endTime, "Auction expired");
        require(msg.value >= auction.startingPrice, "Bid below starting price");
        require(msg.value >= auction.highestBid + MIN_BID_INCREMENT, "Bid too low");

        address previousBidder = auction.highestBidder;
        uint256 previousBid = auction.highestBid;

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        if (previousBidder != address(0)) {
            (bool success, ) = previousBidder.call{value: previousBid}("");
            require(success, "Failed to refund previous bidder");
        }

        emit BidPlaced(_auctionId, msg.sender, msg.value);
    }

    function endAuction(uint256 _auctionId) external nonReentrant {
        Auction storage auction = auctions[_auctionId];
        
        require(!auction.ended, "Auction already ended");
        require(block.timestamp >= auction.endTime, "Auction still active");

        auction.ended = true;

        if (auction.highestBidder != address(0)) {
            auction.nftContract.transferFrom(address(this), auction.highestBidder, auction.tokenId);
            
            (bool success, ) = auction.seller.call{value: auction.highestBid}("");
            require(success, "Failed to send funds to seller");
        } else {
            auction.nftContract.transferFrom(address(this), auction.seller, auction.tokenId);
        }

        emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
    }

    function getAuction(uint256 _auctionId) external view returns (
        address seller,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 endTime,
        address highestBidder,
        uint256 highestBid,
        bool ended,
        address nftContract
    ) {
        Auction storage auction = auctions[_auctionId];
        return (
            auction.seller,
            auction.tokenId,
            auction.startingPrice,
            auction.endTime,
            auction.highestBidder,
            auction.highestBid,
            auction.ended,
            address(auction.nftContract)
        );
    }
}