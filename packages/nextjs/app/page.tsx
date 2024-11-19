"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

import { useEffect, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";
import axios from "axios";
import { 
  useScaffoldContract, 
  useScaffoldContractWrite,  
  notification 
} from "~~/utils/scaffold-eth";

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
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    onDrop: acceptedFiles => {
      setFiles(acceptedFiles);
    }
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

      // Create collection metadata
      const collectionMetadata = {
        name: collectionData.name,
        description: collectionData.description,
        image: uploadedUrls[0], // Use first image as collection image
        external_link: "", // Can add website later
      };

      const baseUri = await uploadMetadataToPinata(collectionMetadata);

      // Deploy contract with IPFS metadata
      // Contract deployment code here...
      
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
