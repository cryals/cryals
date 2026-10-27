import { profile } from '../data/profile';

type LinkItem = {
  label: string;
  detail: string;
  href: string;
  icon?: string;
  materialIcon?: string;
};

const links: LinkItem[] = [
  { label: 'Discord', detail: profile.discord.label, href: profile.discord.href, icon: profile.discord.icon },
  { label: 'Telegram', detail: profile.telegram.label, href: profile.telegram.href, icon: profile.telegram.icon },
  { label: 'Steam / 01', detail: profile.steam[0].label, href: profile.steam[0].href, icon: profile.steam[0].icon },
  { label: 'Steam / 02', detail: profile.steam[1].label, href: profile.steam[1].href, icon: profile.steam[1].icon },
  { label: 'Email', detail: profile.email, href: `mailto:${profile.email}`, materialIcon: 'mail' },
  { label: 'Website', detail: profile.website.label, href: profile.website.href, materialIcon: 'language' },
];

export function SocialLinks() {
  return (
    <nav className="social-links" aria-label="Контакты AL-S">
      {links.map((link) => (
        <a
          className="social-link"
          href={link.href}
          key={`${link.label}-${link.href}`}
          target={link.href.startsWith('mailto:') ? undefined : '_blank'}
          rel={link.href.startsWith('mailto:') ? undefined : 'noreferrer noopener'}
        >
          {link.icon ? <img src={import.meta.env.BASE_URL + link.icon.replace(/^\//, '')} alt="" aria-hidden="true" /> : null}
          {link.materialIcon ? <span className="material-symbols-sharp" aria-hidden="true">{link.materialIcon}</span> : null}
          <span className="social-copy">
            <strong>{link.label}</strong>
            <small>{link.detail}</small>
          </span>
          <span className="material-symbols-sharp social-arrow" aria-hidden="true">north_east</span>
        </a>
      ))}
    </nav>
  );
}
