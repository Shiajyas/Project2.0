const sharp = require("sharp");

const imageProcessing = async (inputFilePath, outputFolderPath) => {
    try {
        const outputFileName = `${Date.now()}_output.jpg`;
        const outputFilePath = `${outputFolderPath}/${outputFileName}`;

        await sharp(inputFilePath)
            .resize(300, 300)
            .toFile(outputFilePath);

        console.log("Image processing successful");
        return outputFilePath.replace('./public', '/public');
    } catch (error) { 
        console.error("Error processing image:", error);
        throw new Error("Error processing image");
    }
};

module.exports = imageProcessing
