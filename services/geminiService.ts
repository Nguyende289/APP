

import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { VerificationRequest } from '../types';

/**
 * Encodes a File or Blob into a Base64 string.
 * @param file The File or Blob to encode.
 * @returns A Promise that resolves with the Base64 encoded string.
 */
async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file as data URL."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Extracts verification request data from an image using the Gemini API.
 * The model is instructed to parse document images and return structured JSON.
 * @param imageFile The File object of the image to process.
 * @returns A Promise that resolves with a Partial<VerificationRequest> containing the extracted data.
 * @throws {Error} If the API call fails or the response format is unexpected.
 */
export async function extractVerificationDataFromImage(imageFile: File): Promise<Partial<VerificationRequest>> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const base64Image = await fileToBase64(imageFile);

    const prompt = `Bạn là một trợ lý thông minh chuyên trích xuất thông tin từ các công văn yêu cầu xác minh.
    Hãy đọc tài liệu hình ảnh được cung cấp và trích xuất các thông tin sau vào định dạng JSON:
    - Số CV (Số công văn yêu cầu xác minh)
    - Ngày CV (Ngày công văn yêu cầu, định dạng YYYY-MM-DD)
    - Họ tên VP (Họ tên người vi phạm)
    - CCCD (Số căn cước công dân)
    - Ngày sinh (Ngày sinh của đối tượng, định dạng YYYY-MM-DD)
    - Địa chỉ (Nơi cư trú hoặc địa chỉ hiện tại)
    - Hành vi vi phạm (Mô tả hành vi vi phạm cần xác minh)

    Nếu một trường thông tin không tìm thấy trong tài liệu, hãy để giá trị là một chuỗi rỗng ("").
    Đảm bảo định dạng ngày tháng là YYYY-MM-DD.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: imageFile.type,
              data: base64Image,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            docNumber: { type: Type.STRING, description: 'Số công văn yêu cầu xác minh.' },
            docDate: { type: Type.STRING, description: 'Ngày công văn yêu cầu, định dạng YYYY-MM-DD.' },
            offenderName: { type: Type.STRING, description: 'Họ tên người vi phạm.' },
            citizenId: { type: Type.STRING, description: 'Số căn cước công dân.' },
            dateOfBirth: { type: Type.STRING, description: 'Ngày sinh của đối tượng, định dạng YYYY-MM-DD.' },
            address: { type: Type.STRING, description: 'Nơi cư trú hoặc địa chỉ hiện tại.' },
            violationBehavior: { type: Type.STRING, description: 'Mô tả hành vi vi phạm cần xác minh.' },
          },
          required: ['docNumber', 'docDate', 'offenderName', 'citizenId', 'dateOfBirth', 'address', 'violationBehavior'],
        },
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) {
      throw new Error('AI did not return any text response for extraction.');
    }

    const parsedData = JSON.parse(jsonText) as Partial<VerificationRequest>;

    // Basic validation and date formatting check
    const formattedData: Partial<VerificationRequest> = {
      docNumber: parsedData.docNumber || '',
      docDate: parsedData.docDate && /^\d{4}-\d{2}-\d{2}$/.test(parsedData.docDate) ? parsedData.docDate : '',
      offenderName: parsedData.offenderName || '',
      citizenId: parsedData.citizenId || '',
      dateOfBirth: parsedData.dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(parsedData.dateOfBirth) ? parsedData.dateOfBirth : '',
      address: parsedData.address || '',
      violationBehavior: parsedData.violationBehavior || '',
    };
    
    return formattedData;

  } catch (error) {
    console.error('Error during AI data extraction:', error);
    // Provide a more user-friendly error message
    throw new Error(`Không thể trích xuất thông tin từ ảnh. Vui lòng thử lại hoặc nhập thủ công. Chi tiết: ${error instanceof Error ? error.message : String(error)}`);
  }
}