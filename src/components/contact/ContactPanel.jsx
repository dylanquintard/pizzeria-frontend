import { useContext, useEffect, useState } from "react";
import { sendContactEmail } from "../../api/contact.api";
import { INSTAGRAM_URL } from "../../config/env";
import { AuthContext } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPanel({ sectionId, sectionClassName = "" }) {
  const { user } = useContext(AuthContext);
  const { tr } = useLanguage();
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactFeedback, setContactFeedback] = useState("");
  const [submittingContact, setSubmittingContact] = useState(false);

  useEffect(() => {
    if (!user) return;
    setContactName((prev) => prev || user.name || "");
    setContactEmail((prev) => prev || user.email || "");
  }, [user]);

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    if (!contactName.trim()) {
      setContactFeedback(tr("Le nom est obligatoire.", "Name is required."));
      return;
    }

    const normalizedEmail = contactEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setContactFeedback(tr("L'email est obligatoire.", "Email is required."));
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setContactFeedback(tr("Format d'email invalide.", "Invalid email format."));
      return;
    }

    if (!contactMessage.trim()) {
      setContactFeedback(tr("Le message est obligatoire.", "Message is required."));
      return;
    }

    try {
      setSubmittingContact(true);
      setContactFeedback("");
      await sendContactEmail({
        name: contactName.trim(),
        email: normalizedEmail,
        subject: contactSubject.trim(),
        message: contactMessage.trim(),
      });
      setContactSubject("");
      setContactMessage("");
      setContactFeedback(
        tr(
          "Message envoye par email. Nous vous repondrons rapidement.",
          "Email sent. We will reply quickly."
        )
      );
    } catch (err) {
      setContactFeedback(
        err.response?.data?.error || tr("Impossible d'envoyer l'email.", "Unable to send email.")
      );
    } finally {
      setSubmittingContact(false);
    }
  };

  return (
    <section id={sectionId} className={sectionClassName}>
      <div className="rounded-3xl border border-white/10 bg-oven-glow p-8 sm:p-10">
        <p className="theme-light-keep-dark text-sm uppercase tracking-[0.25em] text-saffron">
          {tr("Nous contacter", "Contact us")}
        </p>
        <h2 className="mt-2 font-display text-4xl uppercase tracking-wide text-white">
          {tr("On vous repond rapidement", "We reply quickly")}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl bg-charcoal/70 p-5">
            <p className="theme-light-keep-dark text-sm uppercase tracking-wider text-saffron">
              {tr("Telephone", "Phone")}
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {tr("Numero a venir", "Number coming soon")}
            </p>
          </div>
          <div className="rounded-2xl bg-charcoal/70 p-5">
            <p className="theme-light-keep-dark text-sm uppercase tracking-wider text-saffron">Email</p>
            <p className="mt-2 text-lg font-semibold text-white">adresse@email-a-venir.com</p>
          </div>
          <div className="rounded-2xl bg-charcoal/70 p-5">
            <p className="theme-light-keep-dark text-sm uppercase tracking-wider text-saffron">Instagram</p>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="mt-3 inline-flex">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg"
                alt="Instagram"
                className="h-8 w-8 object-contain"
              />
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/15 bg-charcoal/70 p-5">
          <p className="theme-light-keep-dark text-sm uppercase tracking-wider text-saffron">
            {tr("Formulaire de contact", "Contact form")}
          </p>
          <form onSubmit={handleContactSubmit} className="mt-3 space-y-3">
            <input
              type="text"
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              placeholder={tr("Votre nom", "Your name")}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-stone-400 focus:border-saffron focus:outline-none"
            />
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder={tr("Votre email", "Your email")}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-stone-400 focus:border-saffron focus:outline-none"
            />
            <input
              type="text"
              value={contactSubject}
              onChange={(event) => setContactSubject(event.target.value)}
              placeholder={tr("Sujet (optionnel)", "Subject (optional)")}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-stone-400 focus:border-saffron focus:outline-none"
            />
            <textarea
              rows={4}
              value={contactMessage}
              onChange={(event) => setContactMessage(event.target.value)}
              placeholder={tr("Votre message", "Your message")}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-stone-400 focus:border-saffron focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submittingContact}
                className="rounded-full bg-saffron px-5 py-2 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingContact ? tr("Envoi...", "Sending...") : tr("Envoyer", "Send")}
              </button>
              {contactFeedback && <p className="text-xs text-stone-200">{contactFeedback}</p>}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
