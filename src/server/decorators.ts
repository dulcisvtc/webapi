import * as rawbody from "raw-body";
import { createParamDecorator, HttpException, HttpStatus } from "@nestjs/common";

export const PlainBody = createParamDecorator(async (_data, req) => {
    if (req.readable) {
        // @ts-ignore - rawbody types are wrong
        return (await rawbody(req)).toString().trim();
    };
    throw new HttpException('Body aint text/plain', HttpStatus.INTERNAL_SERVER_ERROR);
});