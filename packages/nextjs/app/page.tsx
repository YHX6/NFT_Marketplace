"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

import { useEffect, useState, useCallback } from "react";
import { notification } from "~~/utils/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

import NFTCollectionABI from "../contracts/NFTCollection.json";


import { BrowserProvider, Contract } from "ethers";
import { FileWithPath, useDropzone } from "react-dropzone";
import axios from "axios";

// import { BrowserProvider, Contract } from "../../../node_modules/ethers";
// import { FileWithPath, useDropzone } from "../../../node_modules/react-dropzone";
// import axios from "../../../node_modules/axios";


type Log = {
  topics: string[];
  // Add other properties as needed based on your log data structure
};

const JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

const Home: NextPage = () => {
  const { address } = useAccount();
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [uploading, setUploading] = useState(false);
  const [collectionData, setCollectionData] = useState({
    name: "",
    symbol: "",
    description: "",
    imageUrls: [] as string[],
  });
  // Call useScaffoldWriteContract at the top level
  // const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("NFTCollection");
  // console.log(writeYourContractAsync);


  useEffect(() => {
    console.log(JWT);
  }, [])

  // Handle file upload to Pinata
  const uploadToPinata = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          'Content-Type': `multipart/form-data;`,
          Authorization: `Bearer ${JWT}`
        }
      });

      return `ipfs://${res.data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading to Pinata:", error);
      throw error;
    }
  };

  // Upload metadata to Pinata
  const uploadMetadataToPinata = async (metadata: any) => {
    try {
      const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${JWT}`
        }
      });

      return `ipfs://${res.data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading metadata to Pinata:", error);
      throw error;
    }
  };

  // Handle file drops
  // const { getRootProps, getInputProps } = useDropzone({
  //   accept: {
  //     'image/*': ['.png', '.jpg', '.jpeg', '.gif']
  //   },
  //   onDrop: acceptedFiles => {
  //     setFiles(acceptedFiles);
  //   }
  // });
    // Updated dropzone implementation with proper typing
    const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
      setFiles(acceptedFiles);
    }, []);
  
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
        'image/*': ['.png', '.jpg', '.jpeg', '.gif']
      },
      onDrop,
      multiple: true, // Allow multiple file uploads
      maxSize: 5242880, // Optional: 5MB max file size
    });
  


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Upload images to Pinata
      const uploadPromises = files.map(uploadToPinata);
      const uploadedUrls = await Promise.all(uploadPromises);

      // Create metadata for each NFT
      const metadataPromises = uploadedUrls.map(async (imageUrl, index) => {
        const metadata = {
          name: `${collectionData.name} #${index + 1}`,
          description: collectionData.description,
          image: imageUrl,
          attributes: [] // Add attributes if needed
        };
        return await uploadMetadataToPinata(metadata);
      });

      const metadataUrls = await Promise.all(metadataPromises);

      console.log("Uploaded Metadata to Pinata:", metadataUrls);

      // Create collection metadata
      const collectionMetadata = {
        name: collectionData.name,
        description: collectionData.description,
        image: uploadedUrls[0], // Use first image as collection image
        external_link: "", // Can add website later
      };

      const baseUri = await uploadMetadataToPinata(collectionMetadata);
      console.log("Base URI: ", baseUri);

      // Deploy contract with IPFS metadata
      // 使用 BrowserProvider 替代 Web3Provider
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();



      // 合约实例
      const nftContract = new Contract("0x54549F80b6A7D5B0d618EA4200ad8d4a3e318eCf", NFTCollectionABI.abi, signer);

      console.log(nftContract);
      console.log(Object.keys(nftContract));



      // Step 5: Mint NFTs and set Token URIs
      for (let index = 0; index < metadataUrls.length; index++) {
        const metadataUrl = metadataUrls[index];
        try {
          console.log(`Minting token with metadata URI: ${metadataUrl}`);
          const mintTx = await nftContract.mint(signer.address); // Call mint function
          const receipt = await mintTx.wait();
      
          console.log(receipt);
          console.log(receipt.logs);

          // Extract tokenId from the event logs
          // const event = receipt.logs.find(log => {
          //   try {
          //     return nftContract.interface.getEvent(log.topics[0]) === 'TokenMinted';
          //   } catch (err) {
          //     return false;
          //   }
          // });
          // const event = receipt.logs.find((log: Log) => {
          //   try {
          //     return nftContract.interface.getEvent(log.topics[0]) === 'TokenMinted';
          //   } catch (err) {
          //     return false;
          //   }
          // });

          const event = receipt.logs.find((log: Log) => {
            try {
              const eventFragment = nftContract.interface.getEvent(log.topics[0]);
              return eventFragment?.name === 'TokenMinted';
            } catch (err) {
              return false;
            }
          });

          if (event) {
            const decodedEvent = nftContract.interface.decodeEventLog('TokenMinted', event.data, event.topics);
            const tokenId = decodedEvent.tokenId.toNumber();
            console.log(`Minted tokenId: ${tokenId}`);
             // Set tokenURI for the minted token
            const setTokenUriTx = await nftContract.setTokenURI(tokenId, metadataUrl);
            await setTokenUriTx.wait();
            console.log(`Set tokenURI for tokenId ${tokenId}`);
          } else {
            console.error("TokenMinted event not found in receipt");
          }
      
         
        } catch (error) {
          console.error(`Error minting or setting tokenURI for tokenId ${index + 1}:`, error);
        }
      }

      notification.success("Collection created successfully!");
    } catch (error) {
      console.error("Error creating collection:", error);
      notification.error("Error creating collection");
    } finally {
      setUploading(false);
    }
  };


  // Rest of the component 
  return (
    <>
      <div className="flex flex-col items-center pt-10">
        <div className="max-w-2xl w-full px-6">
          <h1 className="text-4xl font-bold text-center mb-8">Create NFT Collection</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Collection Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Collection Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={collectionData.name}
                  onChange={(e) => setCollectionData({ ...collectionData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Symbol</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={collectionData.symbol}
                  onChange={(e) => setCollectionData({ ...collectionData, symbol: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  className="w-full p-2 border rounded-lg"
                  value={collectionData.description}
                  onChange={(e) => setCollectionData({ ...collectionData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Upload Images</label>
              <div
                {...getRootProps()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary"
              >
                <input {...getInputProps()} />
                <p>Drag & drop images here, or click to select files</p>
              </div>
            </div>

            {/* Preview */}
            {files.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Selected Images</h3>
                <div className="grid grid-cols-4 gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || files.length === 0}
              className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              {uploading ? "Creating Collection..." : "Create Collection"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Home;
