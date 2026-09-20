import { Request, Response } from 'express';

export const uploadFile = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có tệp nào được tải lên.' });
    }
    
    // Construct the public URL for the file
    // Assumes the server is running on localhost:5000 and uploads are served at /uploads
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    return res.status(200).json({
      message: 'Tải tệp thành công',
      url: fileUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Lỗi khi tải tệp lên:', error);
    return res.status(500).json({ message: 'Lỗi server khi xử lý tệp' });
  }
};
