import { Body, Controller, Delete, Get, Headers, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../decorators/auth.decorator";
import { PatchDeleteDownloadsUriDto, PostPatchDownloadsDto } from "../dtos/downloads.dtos";
import { AuthService } from "../services/auth.service";
import { DownloadsService } from "../services/downloads.service";

@Controller("downloads")
export class DownloadsController {
  constructor(
    private authService: AuthService,
    private downloadsService: DownloadsService
  ) {}

  @Get()
  async getDownloads() {
    return this.downloadsService.getDownloads();
  }

  @Post()
  @RequirePermissions("ManageDownloads")
  async createDownload(@Body() data: PostPatchDownloadsDto, @Headers("authorization") head: string) {
    const document = await this.authService.getUserDocument(head.split(" ")[1] ?? "");

    return this.downloadsService.createDownload(data, document);
  }

  @Patch(":id")
  @RequirePermissions("ManageDownloads")
  async editDownload(@Param() params: PatchDeleteDownloadsUriDto, @Body() data: PostPatchDownloadsDto) {
    const res = await this.downloadsService.editDownload(params.id, data);

    if (!res) throw new NotFoundException("Download not found");

    return {
      message: `Edited download with id ${params.id}`,
    };
  }

  @Delete(":id")
  @RequirePermissions("ManageDownloads")
  async deleteDownload(@Param() params: PatchDeleteDownloadsUriDto) {
    const res = await this.downloadsService.deleteDownload(params.id);

    if (!res) throw new NotFoundException("Download not found");

    return {
      message: `Deleted download with id ${params.id}`,
    };
  }
}
