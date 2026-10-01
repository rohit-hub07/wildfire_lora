import mongoose, { Schema, Document, Model } from "mongoose";

export interface IKnowledgeDocument extends Document {
  title: string;
  content: string;
  category: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeDocumentSchema = new Schema<IKnowledgeDocument>(
  {
    title: { type: String, required: true, index: true },
    content: { type: String, required: true },
    category: { type: String, required: true, index: true },
    source: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const KnowledgeDocument: Model<IKnowledgeDocument> =
  mongoose.models.KnowledgeDocument ||
  mongoose.model<IKnowledgeDocument>("KnowledgeDocument", KnowledgeDocumentSchema);
