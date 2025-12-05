import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../../../config/env';
import { AuthService } from '../services/auth.service';
import { registerDto, loginDto } from '../dto/auth.dto';
import { asyncHandler } from '../../../common/async-handler';
import { ValidationError } from '../../../common/errors';
import { authRateLimiter } from '../../../common/middleware/rate-limiter';

export class AuthController {
  public router: Router;
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.router = Router();
    this.authService = authService;
    this.setupRoutes();
    this.setupGoogleStrategy();
  }

  private setupGoogleStrategy() {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.oauth.google.clientId,
          clientSecret: config.oauth.google.clientSecret,
          callbackURL: config.oauth.google.callbackUrl,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await this.authService.findOrCreateGoogleUser(profile);
            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );

    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
      try {
        // This is simplified - in production, fetch from DB
        done(null, { id });
      } catch (error) {
        done(error, null);
      }
    });
  }

  private setupRoutes() {
    this.router.post(
      '/register',
      authRateLimiter,
      asyncHandler(this.register.bind(this))
    );
    this.router.post(
      '/login',
      authRateLimiter,
      asyncHandler(this.login.bind(this))
    );
    this.router.post('/refresh', asyncHandler(this.refresh.bind(this)));
    this.router.post('/logout', asyncHandler(this.logout.bind(this)));

    // Google OAuth routes
    this.router.get(
      '/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );
    this.router.get(
      '/google/callback',
      passport.authenticate('google', { session: false }),
      asyncHandler(this.googleCallback.bind(this))
    );
  }

  private async register(req: Request, res: Response) {
    const validationResult = registerDto.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(
        validationResult.error.errors.map((e) => e.message).join(', ')
      );
    }

    const result = await this.authService.register(validationResult.data);

    res.status(201).json({
      success: true,
      data: result,
    });
  }

  private async login(req: Request, res: Response) {
    const validationResult = loginDto.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(
        validationResult.error.errors.map((e) => e.message).join(', ')
      );
    }

    const result = await this.authService.login(validationResult.data);

    res.json({
      success: true,
      data: result,
    });
  }

  private async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    const tokens = await this.authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  }

  private async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  private async googleCallback(req: Request, res: Response) {
    const user = req.user as any;
    if (!user) {
      return res.redirect(`${config.frontend.url}/login?error=oauth_failed`);
    }

    const tokens = await this.authService.generateTokens(user);

    // Redirect to frontend with tokens (in production, use secure httpOnly cookies)
    const tokenParams = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    res.redirect(`${config.frontend.url}/auth/callback?${tokenParams.toString()}`);
  }
}

