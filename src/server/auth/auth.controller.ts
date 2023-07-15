import { Body, Controller, Get, HttpCode, Post, Req, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import type { PostAuthLoginResponse, PostAuthLogoutResponse, SessionInfoResponse, UserInfoResponse } from "./auth";
import { PostAuthLoginDto, PostAuthLogoutDto } from "./auth.dtos";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) { };

    @Post("login")
    async login(
        @Req() req: Request,
        @Body() data: PostAuthLoginDto
    ): Promise<PostAuthLoginResponse> {
        switch (data.provider) {
            case "discord":
                return await this.authService.loginWithDiscord(data.code, data.scope);
            case "steam":
                return await this.authService.loginWithSteam(req, data.code);
        };
    };

    @HttpCode(200)
    @Post("logout")
    async logout(
        @Body() data: PostAuthLogoutDto
    ): Promise<PostAuthLogoutResponse> {
        return await this.authService.logout(data.access_token);
    };

    @Get("sessionInfo")
    async sessionInfo(
        @Req() req: Request
    ): Promise<SessionInfoResponse> {
        const access_token = req.headers.authorization?.split(" ")[1];
        if (!access_token) throw new UnauthorizedException();

        return await this.authService.getSessionInfo(access_token);
    };

    @Get("userInfo")
    async userInfo(
        @Req() req: Request
    ): Promise<UserInfoResponse> {
        const access_token = req.headers.authorization?.split(" ")[1];
        if (!access_token) throw new UnauthorizedException();

        return await this.authService.getUserInfo(access_token);
    };
};