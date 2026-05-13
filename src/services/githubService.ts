/**
 * GitHub API를 이용한 정적 콘텐츠 관리 서비스
 * (Stage 1: 토큰 검증 및 데이터 읽기 전용)
 */

export interface GithubFileInfo {
  name: string;
  path: string;
  sha: string;
  content?: string;
  encoding?: string;
}

export class GithubService {
  private baseUrl = 'https://api.github.com';

  constructor(
    private token: string,
    private owner: string,
    private repo: string
  ) {}

  /**
   * 토큰 유효성 및 저장소 접근 권한 검증
   */
  async validateAuth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('GitHub auth validation failed:', error);
      return false;
    }
  }

  /**
   * 특정 경로의 파일 내용 가져오기
   */
  async getFile(path: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch file: ${path}`);

      const data = await response.json();
      
      // 베이스64 디코딩 (한글 깨짐 방지를 위해 decodeURIComponent/escape 사용)
      const decodedContent = decodeURIComponent(
        atob(data.content.replace(/\n/g, ''))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(decodedContent);
    } catch (error) {
      console.error(`Error fetching ${path} from GitHub:`, error);
      throw error;
    }
  }

  /**
   * 여러 파일을 한 번에 가져오기 (Stage 1 대시보드용)
   */
  async getAllConfigData() {
    const [properties, reviews, osakaInfo, siteConfig] = await Promise.all([
      this.getFile('src/data/properties.json').catch(() => null),
      this.getFile('src/data/reviews.json').catch(() => null),
      this.getFile('src/data/osakaInfo.json').catch(() => null),
      this.getFile('src/data/siteConfig.json').catch(() => null),
    ]);

    return {
      properties,
      reviews,
      osakaInfo,
      siteConfig,
    };
  }
}

export const createGithubService = (token: string, owner: string, repo: string) => {
  return new GithubService(token, owner, repo);
};
