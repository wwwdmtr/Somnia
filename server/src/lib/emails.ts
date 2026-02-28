import { promises as fs } from 'fs';
import path from 'path';

import { type Post, type User } from '@prisma/client';
import fg from 'fast-glob';
import Handlebars from 'handlebars';
import _ from 'lodash';

import { env } from './env';
import { logger } from './logger';

const getHbrTemplates = _.memoize(async () => {
  const htmlPathsPattern = path.resolve(__dirname, '../emails/dist/**/*.html');
  const htmlPaths = fg.sync(htmlPathsPattern);
  const hbrTemplates: Record<string, HandlebarsTemplateDelegate> = {};
  for (const htmlPath of htmlPaths) {
    const templateName = path.basename(htmlPath, '.html');
    const htmlTemplate = await fs.readFile(htmlPath, 'utf8');
    hbrTemplates[templateName] = Handlebars.compile(htmlTemplate);
  }
  return hbrTemplates;
});

const getEmailHtml = async (
  templateName: string,
  templateVariables: Record<string, unknown> = {},
) => {
  const hbrTemplates = await getHbrTemplates();
  const hbrTemplate = hbrTemplates[templateName];
  if (!hbrTemplate) {
    throw new Error(`Email template not found: ${templateName}`);
  }
  const html = hbrTemplate(templateVariables);
  return html;
};

const sendEmail = async ({
  to,
  subject,
  templateName,
  templateVariables = {},
}: {
  to: string;
  subject: string;
  templateName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  templateVariables?: Record<string, any>;
}) => {
  try {
    const fullTemplateVaraibles = {
      ...templateVariables,
      homeUrl: env.WEBAPP_URL,
    };
    const html = await getEmailHtml(templateName, fullTemplateVaraibles);
    logger.info('email', 'sendEmail', {
      to,
      subject,
      templateName,
      html,
    });
    return { ok: true };
  } catch (error) {
    logger.error('email', error);
    return { ok: false };
  }
};

export const sendWelcomeEmail = async ({
  user,
}: {
  user: Pick<User, 'nickname' | 'email'>;
}) => {
  return await sendEmail({
    to: user.email,
    subject: 'Thanks For Registration!',
    templateName: 'welcome',
    templateVariables: {
      userNick: user.nickname,
      addIdeaUrl: `${env.WEBAPP_URL}`,
    },
  });
};

export const sendPostBlockedEmail = async ({
  user,
  post,
}: {
  user: Pick<User, 'email'>;
  post: Pick<Post, 'title'>;
}) => {
  return await sendEmail({
    to: user.email,
    subject: 'Your Post Blocked!',
    templateName: 'postBlocked',
    templateVariables: {
      postTitle: post.title,
    },
  });
};
