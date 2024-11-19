// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTCollection is ERC721, ERC721Enumerable, Ownable {
    using Strings for uint256;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Maximum supply of NFTs in the collection
    uint256 public maxSupply;
    
    // Current token ID
    uint256 private _currentTokenId;
    
    // Collection details
    string public collectionDescription;
    
    // Mapping to store individual token URIs if needed
    mapping(uint256 => string) private _tokenURIs;

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI,
        string memory description,
        uint256 _maxSupply,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
        _baseTokenURI = baseURI;
        collectionDescription = description;
        maxSupply = _maxSupply;
    }

    function mint(address to) public onlyOwner returns (uint256) {
        require(_currentTokenId < maxSupply, "Maximum supply reached");
        
        _currentTokenId++;
        uint256 newTokenId = _currentTokenId;
        
        _safeMint(to, newTokenId);
        
        return newTokenId;
    }

    function batchMint(address to, uint256 quantity) public onlyOwner {
        require(_currentTokenId + quantity <= maxSupply, "Would exceed maximum supply");
        
        for (uint256 i = 0; i < quantity; i++) {
            mint(to);
        }
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _tokenURIs[tokenId] = _tokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        string memory _tokenURI = _tokenURIs[tokenId];
        
        // If there's no specific token URI, use the base URI + token ID
        if (bytes(_tokenURI).length == 0) {
            return bytes(_baseURI()).length > 0 ? 
                string(abi.encodePacked(_baseURI(), tokenId.toString())) : "";
        }

        return _tokenURI;
    }

    function totalMinted() public view returns (uint256) {
        return _currentTokenId;
    }

    // Override required functions
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}