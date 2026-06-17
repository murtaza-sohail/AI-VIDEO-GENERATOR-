const { main } = require('../index');

export default async function handler(req, res) {
  try {
    // We enforce a Vercel max duration for the function via vercel.json,
    // but the 13-minute video generation will likely time out after 60s (Vercel Pro).
    await main();
    
    res.status(200).json({ 
      success: true, 
      message: "Video generation completed successfully!" 
    });
  } catch (error) {
    console.error("Vercel Generation Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "An error occurred during video generation" 
    });
  }
}
