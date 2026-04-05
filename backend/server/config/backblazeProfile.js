import axios from "axios"
import { getUploadUrl } from "./backblaze.js"


export const uploadToB2 = async (fileBuffer, fileName, folder = "profile" ) => {
    try {
        //   Construct filename with prefix (folder)
        const fullFileName = `${folder}/${Date.now()}_${fileName}`;
        const encodedFileName = encodeURIComponent(fullFileName); // URL-encode the file name


        //  Get the Upload and token
        const { uploadUrl, authorizationToken } = await getUploadUrl(process.env.B2_BUCKET_ID);

        // Upload the file
        const response = await axios.post(uploadUrl, fileBuffer, {
            headers: {
                Authorization: authorizationToken,
                "X-Bz-File-Name": encodedFileName,
                "Content-Type": "b2/x-auto",
                "X-Bz-Content-Sha1": "do_not_verify", // optional but faster
              },
        })
        const downloadUrl = `${process.env.BACKBLAZE_DOWNLOAD_URL}/file/${process.env.BACKBLAZE_BUCKET_NAME}/${fullFileName}`;

        return downloadUrl

    } catch (error) {
        console.error("Upload to B2 failed:", error.response?.data || error.message);
        throw error;
    }
}