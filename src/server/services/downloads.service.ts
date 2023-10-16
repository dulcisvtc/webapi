import { Injectable } from "@nestjs/common";
import { Download, UserDocument } from "../../database";
import type { PostPatchDownloadsDto } from "../dtos/downloads.dtos";

@Injectable()
export class DownloadsService {
    async getDownloads() {
        const downloads = await Download.find({}, "-__v").lean();

        return downloads;
    };

    async getDownload(id: number) {
        const download = await Download.findById(id, "-__v").exec();

        return download;
    };

    async createDownload(
        data: PostPatchDownloadsDto,
        user: UserDocument
    ) {
        const { _id: id } = await Download.create({
            ...data,
            createdBy: user
        });

        const download = (await Download.findById(id, "-__v").exec())!;

        return download;
    };

    async editDownload(id: number, data: PostPatchDownloadsDto) {
        const download = await this.getDownload(id);

        if (!download) return null;

        const newDownload = await Download.findByIdAndUpdate(id, { ...data }, { new: true });

        return newDownload;
    };

    async deleteDownload(id: number) {
        const res = await Download.findByIdAndDelete(id);

        return res;
    };
};