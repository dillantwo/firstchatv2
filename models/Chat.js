import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
    {
        name: {type: String, required: true},
        messages: [
            {
                role: {type: String, required: true},
                content: {type: String, required: true},
                timestamp: {type: Number, required: true},
                images: [
                    {
                        name: {type: String},
                        url: {type: String}
                    }
                ],
                documents: [
                    {
                        name: {type: String},
                        type: {type: String},
                        text: {type: String},
                        pages: {type: Number}
                    }
                ],
                // Token usage for this specific message (if available from AI provider)
                tokenUsage: {
                    promptTokens: {type: Number, default: 0},
                    completionTokens: {type: Number, default: 0},
                    totalTokens: {type: Number, default: 0}
                }
            },
        ],
        userId: {type: String, required: true},
        chatflowId: {type: String, default: null}, // Associate with specific chatflow
        courseId: {type: String, default: null}, // Associate with specific course for token tracking
        // Aggregate token usage for this entire chat
        totalTokenUsage: {
            promptTokens: {type: Number, default: 0},
            completionTokens: {type: Number, default: 0},
            totalTokens: {type: Number, default: 0},
            lastUpdated: {type: Date, default: Date.now}
        }
    },
    {timestamps: true}
);

const Chat = mongoose.models.Chat || mongoose.model("Chat", ChatSchema)

export default Chat;