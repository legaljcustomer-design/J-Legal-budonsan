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

  /**
   * 여러 파일을 하나의 커밋으로 묶어 저장 (Stage 2 핵심 기능)
   */
  async commitMultipleFiles(
    files: { path: string; content: string }[],
    message: string,
    branch: string = 'main'
  ): Promise<boolean> {
    try {
      const headers = {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      };

      // 1. 현재 브랜치의 최신 커밋 SHA 가져오기
      const refResponse = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/git/refs/heads/${branch}`, { headers });
      if (!refResponse.ok) throw new Error('Failed to get branch ref');
      const refData = await refResponse.json();
      const lastCommitSha = refData.object.sha;

      // 2. 최신 커밋의 Tree SHA 가져오기
      const commitResponse = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/git/commits/${lastCommitSha}`, { headers });
      if (!commitResponse.ok) throw new Error('Failed to get last commit');
      const commitData = await commitResponse.json();
      const baseTreeSha = commitData.tree.sha;

      // 3. 새로운 Tree 생성 
      // (기존 tree를 베이스로 하여 변경된 파일들만 덮어쓰기)
      const treeItems = files.map(file => ({
        path: file.path,
        mode: '100644', // 일반 파일
        type: 'blob',
        content: file.content
      }));

      const newTreeResponse = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/git/trees`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems
        })
      });
      if (!newTreeResponse.ok) throw new Error('Failed to create new tree');
      const newTreeData = await newTreeResponse.json();
      const newTreeSha = newTreeData.sha;

      // 4. 새로운 Commit 생성
      const newCommitResponse = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          tree: newTreeSha,
          parents: [lastCommitSha]
        })
      });
      if (!newCommitResponse.ok) throw new Error('Failed to create new commit');
      const newCommitData = await newCommitResponse.json();
      const newCommitSha = newCommitData.sha;

      // 5. Ref 업데이트 (브랜치 포인터를 새 커밋으로 이동)
      const updateRefResponse = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: newCommitSha,
          force: false // 비강제 업데이트 (충돌 시 실패하도록 함)
        })
      });

      if (!updateRefResponse.ok) {
        const err = await updateRefResponse.json();
        throw new Error(`Failed to update ref: ${err.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in multi-file commit:', error);
      throw error;
    }
  }
}

export const createGithubService = (token: string, owner: string, repo: string) => {
  return new GithubService(token, owner, repo);
};
