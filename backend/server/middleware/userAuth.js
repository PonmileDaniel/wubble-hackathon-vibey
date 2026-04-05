import jwt from 'jsonwebtoken';

const userAuth = async (req, res, next) => {
    try {
        // Ensure cookies exist
        if (!req.cookies || !req.cookies.token) {
            return res.status(401).json({ success: false, message: 'Not Authorized' });
        }

        const token = req.cookies.token;
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if (!tokenDecode.id) {
            return res.status(401).json({ success: false, message: 'Not Authorized, Login Again' });
        }

        // Attach user ID to `req.user`
        req.user = { _id: tokenDecode.id };
        
        next(); // Move to the next middleware or route handler

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export default userAuth;
