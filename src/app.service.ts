import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { catchError, map, of } from 'rxjs';
import { SupportedPlatforms } from './data';
import { PlatformResponseDto } from './dtos/platform-response.dto';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly httpService: HttpService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkUsernameAvailability(
    username: string,
    platforms: string[],
  ): Promise<PlatformResponseDto[]> {
    const availability: PlatformResponseDto[] = [];

    await Promise.all(
      platforms.map(async (platform) => {
        const platformCheckResponse = await this.checkUsernameOnPlatform(
          platform.trim().toLowerCase(),
          username,
        );
        availability.push(platformCheckResponse);
      }),
    );

    return availability;
  }

  async checkUsernameOnPlatform(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    try {
      if (SupportedPlatforms.includes(platform)) {
        return await this.huntUsername(platform, username);
      }
      const result = new PlatformResponseDto();
      result.platform = platform;
      result.verify = null;
      result.message = `${platform} is not supported yet!`;
      result.available = null;
      return result;
    } catch (error) {
      const msg = error.message;
      this.logger.error(msg, error);
      throw new Error(msg);
    }
  }

  async checkGitHub2(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    const githubUrl = `https://api.github.com/users/${username}`;
    const result = new PlatformResponseDto();
    result.platform = platform;
    result.verify = '';
    result.message = '';
    result.available;

    try {
      const data = this.httpService
        .request({
          method: 'GET',
          url: githubUrl,
        })
        .pipe(
          map((res) => {
            return false;
          }),
        )
        .pipe(
          catchError((error: AxiosError) => {
            if (error.response.status === 404) {
              return of(true);
            }
            return of(false);
          }),
        );
      //result.available = data;
    } catch (error) {
      //console.log(error);
    }
    return result;
  }

  async checkGitHub(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    const result = new PlatformResponseDto();
    result.platform = platform;
    result.verify = '';
    result.message = '';

    try {
      const response: AxiosResponse = await axios.get(
        `https://api.github.com/users/${username}`,
      );

      result.available = response.status === 404;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        result.available = error.response.status === 404;
      } else {
        // Handle other types of errors if needed
        result.available = null;
      }
    }

    return result;
  }

  async huntUsername(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    const result = new PlatformResponseDto();
    result.platform = platform;
    result.verify = '';
    result.message = '';

    try {
      const response: AxiosResponse = await axios.get(
        `https://api.instantusername.com/check/${platform}/${username}`,
      );
      result.verify = response.data.url;
      result.available = response.data.available;
    } catch (error) {
      this.logger.error(error);
      console.error(error);
      result.available = null;
      result.message = error.message;
      result.verify = error;
    }

    return result;
  }
}
