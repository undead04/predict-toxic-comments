
import mongoose, { Document, Schema } from 'mongoose'

export interface ILiveCommentAnalysis extends Document {
    comment_id: string
    video_id: string
    author_id: string
    author_name: string
    author_image: string
    message: string
    published_at: Date
    toxic_label: string
    recommended_action: string
    toxic_category: string
}

const LiveCommentAnalysisSchema: Schema = new Schema({
    comment_id: { type: String, required: true, unique: true },
    video_id: { type: String, required: true, index: true },
    author_id: { type: String, required: true },
    author_name: { type: String, required: true },
    author_image: { type: String },
    message: { type: String, required: true },
    published_at: { type: Date, required: true },
    toxic_label: { type: String, required: true },
    recommended_action: { type: String, required: true },
    toxic_category: { type: String, required: true },
}, {
    timestamps: true
})



export const CommentModel = mongoose.model<ILiveCommentAnalysis>('LiveCommentAnalysis', LiveCommentAnalysisSchema, "live_comment_analysis")
