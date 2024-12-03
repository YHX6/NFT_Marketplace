// // /nextjs/utils/mintNFT.tsx
// import { useContractWrite, usePrepareContractWrite } from "wagmi";

// export function mintNFT({ contractAddress, contractABI, recipient, tokenURI }: { 
//   contractAddress: string; 
//   contractABI: any; 
//   recipient: string; 
//   tokenURI: string; 
// }) {
//   const { config } = usePrepareContractWrite({
//     address: contractAddress,
//     abi: contractABI,
//     functionName: "mint",
//     args: [recipient, tokenURI], // Arguments for your mint function
//   });

//   const { write, isLoading, isSuccess } = useContractWrite(config);

//   return (
//     <button
//       onClick={() => write?.()}
//       disabled={isLoading}
//       className="bg-primary text-white py-2 px-4 rounded-lg"
//     >
//       {isLoading ? "Minting..." : isSuccess ? "Minted!" : "Mint NFT"}
//     </button>
//   );
// }
