import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const responseBody = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(ctx.getRequest()),
            message:
                exception instanceof HttpException
                    ? exception.getResponse()
                    : 'Internal Server Error',
        };

        if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
            // Log the full error but don't expose it to the client
            this.logger.error(`Exception: ${exception}`);
        } else {
            this.logger.warn(`HttpException: ${JSON.stringify(responseBody)}`);
        }

        const res = ctx.getResponse();
        if (res.headersSent) {
            this.logger.warn(`Headers already sent for ${responseBody.path}. Skipping redundant exception response.`);
            return;
        }

        httpAdapter.reply(res, responseBody, httpStatus);
    }
}
