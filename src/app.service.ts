import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { PlatformResponseDto } from './dtos/platform-response.dto';
const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  //private driver: selenium.ThenableWebDriver;

  headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  };
  constructor(private readonly httpService: HttpService) {
    // const { WebDriver } = require('selenium-webdriver');
    // this.driver = new WebDriver({ browser: 'chrome' });
    // // this.driver.setCapability('desktops', [
    // //   { name: 'Win 10', version: '1903' },
    // // ]);
    // const chromeOptions = new chrome.Options();
    // chromeOptions.addArguments('headless'); // for headless execution
    // chromeOptions.addArguments('disable-gpu');
    // this.driver = new selenium.Builder()
    //   .forBrowser('chrome')
    //   .setChromeOptions(chromeOptions)
    //   .build();
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
      switch (platform) {
        case 'github':
          return this.huntGithub(platform, username);
        case 'instagram':
          return this.huntInstagram(platform, username);
        // case 'twitter':
        //   return this.huntTwitter(platform, username);
        case 'facebook':
          return this.huntFacebook(platform, username);
        // case 'linkedin':
        //   return this.huntLinkedin(platform, username);
        case 'youtube':
          return this.huntYoutube(platform, username);
        case 'threads':
          return this.huntThreads(platform, username);
        // case 'telegram':
        //   return this.huntTelegram(platform, username);
        case 'snapchat':
          return this.huntSnapchat(platform, username);
        case 'tiktok':
          return this.huntTiktok(platform, username);
        default:
          const result = new PlatformResponseDto();
          result.platform = platform;
          result.username = username;
          result.url = null;
          result.message = `${platform} is not supported yet!`;
          result.available = null;
          result.verified = true;
          return result;
      }
    } catch (error) {
      const msg = error.message;
      this.logger.error(msg, error);
      throw new Error(msg);
    }
  }

  async huntGithub(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    const result = new PlatformResponseDto();
    result.platform = platform;
    result.username = username;
    result.url = `https://github.com/${username}`;
    result.verified = false;

    try {
      const response: AxiosResponse = await axios.get(
        `https://api.github.com/users/${username}`,
        { headers: this.headers },
      );

      result.available = false;
      result.verified = true;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        result.available = true;
        result.verified = true;
      } else {
        this.logger.error(error);
        result.message = 'Unable to verify availability due to an error';
        result.available = null;
      }
    }
    result.message ??= result.available
      ? 'Username is available for use'
      : 'Username is already taken';

    return result;
  }

  async huntInstagram(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    const result = new PlatformResponseDto();
    result.platform = platform;
    result.username = username;
    result.url = `https://www.instagram.com/${username}`;
    result.verified = false;
    try {
      const response = await this.httpService
        .get(result.url, {
          headers: {
            'User-Agent': 'PostmanRuntime/7.36.0',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
        })
        .toPromise();
      console.log({ response });
      if (!response.data) {
        throw new Error('No data received from the URL.');
      }
      const html = response.data;
      const $ = cheerio.load(html);
      const htmlBodyText = $('body').text();
      result.available = !htmlBodyText.includes('"user_id"');
      result.verified = true;
    } catch (error) {
      this.logger.error(error);
      result.message = 'Unable to verify availability due to an error';
      result.available = null;
    }
    result.message ??= result.available
      ? 'Username is available for use'
      : 'Username is already taken';
    return result;
  }

  // async huntInstagram(platform, username) {
  //   let driver = await new Builder()
  //     .forBrowser('chrome')
  //     .setChromeOptions(new chrome.Options().headless()) // Run in headless mode
  //     .build();

  //   try {
  //     // Navigate to the Instagram profile
  //     await driver.get(`https://www.instagram.com/${username}`);

  //     // Get the page source and load with Cheerio
  //     const pageSource = await driver.getPageSource();
  //     const $ = cheerio.load(pageSource);

  //     // Analyze the page source to determine if the profile is available
  //     const htmlBodyText = $('body').text();
  //     const isAvailable = !htmlBodyText.includes('"user_id"');
  //     console.log({ htmlBodyText });

  //     // Process the result
  //     console.log({ username, isAvailable });
  //     return {
  //       platform: 'Instagram',
  //       username: username,
  //       url: `https://www.instagram.com/${username}`,
  //       available: isAvailable,
  //       verified: false,
  //       message: null,
  //     };
  //   } catch (error) {
  //     console.error(error);
  //     throw error;
  //   } finally {
  //     await driver.quit();
  //   }
  // }

  async huntTwitter(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    const result = new PlatformResponseDto();
    result.platform = platform;
    result.username = username;
    result.url = `https://twitter.com/${username}`;
    result.verified = false;
    try {
      const response = await this.httpService
        .get(result.url, { headers: this.headers })
        .toPromise();
      if (!response.data) {
        throw new Error('No data received from the URL.');
      }
      const html = response.data;
      const $ = cheerio.load(html);
      const htmlBodyText = $('body').text();
      result.available = htmlBodyText.includes('This account doesn’t exist');
      result.verified = true;
    } catch (error) {
      this.logger.error(error);
      result.message = 'Unable to verify availability due to an error';
      result.available = null;
    }
    result.message ??= result.available
      ? 'Username is available for use'
      : 'Username is already taken';
    return result;
  }

  // async fetchHtmlAndSearch(
  //   platform: string,
  //   username: string,
  // ): Promise<PlatformResponseDto> {
  //   const result = new PlatformResponseDto();
  //   result.platform = platform;
  //   result.username = username;
  //   result.url = `https://twitter.com/${username}`;
  //   result.verified = false;
  //   try {
  //     await this.driver.get(result.url);
  //     const pageSource = await this.driver.getPageSource();

  //     // Perform the search
  //     result.available = pageSource.includes('This account doesn’t exist');
  //     result.verified = true;

  //     // Close browser session to free resources
  //     await this.driver.quit();
  //   } catch (error) {
  //     // Necessary to quit the session in case of errors to prevent resource leakage
  //     await this.driver.quit();

  //     this.logger.error(error);
  //     result.message = 'Unable to verify availability due to an error';
  //     result.available = null;
  //   }

  //   result.message ??= result.available
  //     ? 'Username is available for use'
  //     : 'Username is already taken';
  //   return result;
  // }

  async huntFacebook(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    const result = new PlatformResponseDto();
    result.platform = platform;
    result.username = username;
    result.url = `https://web.facebook.com/${username}`;
    result.verified = false;
    try {
      const response = await this.httpService.get(result.url).toPromise();
      if (!response.data) {
        throw new Error('No data received from the URL.');
      }
      const html = response.data;
      const $ = cheerio.load(html);
      const htmlBodyText = $('body').text();
      result.available = !htmlBodyText.includes('"userID"');
      result.verified = result.available ? false : true;
    } catch (error) {
      this.logger.error(error);
      result.message = 'Unable to verify availability due to an error';
      result.available = null;
    }
    result.message ??= result.available
      ? 'Username is available for use'
      : 'Username is already taken';
    return result;
  }

  async huntLinkedin(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    const result = new PlatformResponseDto();
    result.platform = platform;
    result.username = username;
    result.url = `https://web.facebook.com/${username}`;
    result.verified = false;
    try {
      const response = await this.httpService
        .get(result.url, { headers: this.headers })
        .toPromise();
      if (!response.data) {
        throw new Error('No data received from the URL.');
      }
      const html = response.data;
      const $ = cheerio.load(html);
      const htmlBodyText = $('body').text();
      result.available = !htmlBodyText.includes('"userID"');
      result.verified = true;
    } catch (error) {
      this.logger.error(error);
      result.message = 'Unable to verify availability due to an error';
      result.available = null;
    }
    result.message ??= result.available
      ? 'Username is available for use'
      : 'Username is already taken';
    return result;
  }

  async huntThreads(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    const result = new PlatformResponseDto();
    result.platform = platform;
    result.username = username;
    result.url = `https://www.threads.net/@${username}`;
    result.verified = false;
    try {
      const response = await this.httpService.get(result.url).toPromise();
      if (!response.data) {
        throw new Error('No data received from the URL.');
      }
      const html = response.data;
      const $ = cheerio.load(html);
      const htmlBodyText = $('body').text();
      result.available = !htmlBodyText.includes('"user_id"');
      result.verified = true;
    } catch (error) {
      this.logger.error(error);
      result.message = 'Unable to verify availability due to an error';
      result.available = null;
    }
    result.message ??= result.available
      ? 'Username is available for use'
      : 'Username is already taken';
    return result;
  }

  async huntYoutube(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    const result = new PlatformResponseDto();
    result.platform = platform;
    result.username = username;
    result.url = `https://www.youtube.com/@${username}`;
    result.verified = false;
    try {
      const response: AxiosResponse = await axios.get(result.url);

      result.available = false;
      result.verified = true;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        result.available = true;
        result.verified = true;
      } else {
        this.logger.error(error);
        result.message = 'Unable to verify availability due to an error';
        result.available = null;
      }
    }
    result.message ??= result.available
      ? 'Username is available for use'
      : 'Username is already taken';
    return result;
  }

  async huntTelegram(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    const result = new PlatformResponseDto();
    result.platform = platform;
    result.username = username;
    result.url = `https://www.youtube.com/@${username}`;
    result.verified = false;
    try {
      const response: AxiosResponse = await axios.get(result.url);

      result.available = false;
      result.verified = true;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        result.available = true;
        result.verified = true;
      } else {
        this.logger.error(error);
        result.message = 'Unable to verify availability due to an error';
        result.available = null;
      }
    }
    result.message ??= result.available
      ? 'Username is available for use'
      : 'Username is already taken';
    return result;
  }

  async huntSnapchat(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    const result = new PlatformResponseDto();
    result.platform = platform;
    result.username = username;
    result.url = `https://www.snapchat.com/add/${username}`;
    result.verified = false;
    try {
      const response: AxiosResponse = await axios.get(result.url);

      result.available = false;
      result.verified = true;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        result.available = true;
        result.verified = true;
      } else {
        this.logger.error(error);
        result.message = 'Unable to verify availability due to an error';
        result.available = null;
      }
    }
    result.message ??= result.available
      ? 'Username is available for use'
      : 'Username is already taken';
    return result;
  }

  async huntTiktok(
    platform: string,
    username: string,
  ): Promise<PlatformResponseDto> {
    const result = new PlatformResponseDto();
    result.platform = platform;
    result.username = username;
    result.url = `https://www.tiktok.com/@${username}`;
    result.verified = false;
    try {
      const response = await this.httpService.get(result.url).toPromise();
      if (!response.data) {
        throw new Error('No data received from the URL.');
      }
      const html = response.data;
      const $ = cheerio.load(html);
      const htmlBodyText = $('body').text();
      result.available = !htmlBodyText.includes('"uniqueId"');
      result.verified = true;
    } catch (error) {
      this.logger.error(error);
      result.message = 'Unable to verify availability due to an error';
      result.available = null;
    }
    result.message ??= result.available
      ? 'Username is available for use'
      : 'Username is already taken';
    return result;
  }
}
