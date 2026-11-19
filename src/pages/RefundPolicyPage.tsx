import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { isConfiguredEmail, publicContactEmails } from '../config/publicContact';

type PolicySection = { title: string; paragraphs?: string[]; bullets?: string[] };

const sections: PolicySection[] = [
  { title: '1. Scope and principles', paragraphs: [
    'This policy explains how Sophis Central reviews refund requests for paid academic materials, Wisdom Points, platform services, and other paid offerings, but only where the relevant purchase or payment feature has been officially enabled and the transaction was made through a payment channel provided or approved by Sophis Central. A planned feature is not currently purchasable and does not create a refund transaction before launch.',
    'Requests are assessed fairly using the transaction record, the service or access promised, the evidence available, the circumstances of the request, and applicable consumer-protection law.'
  ]},
  { title: '2. Circumstances that may qualify', bullets: [
    'A payment was debited but the transaction failed and the paid access, points, or service was not delivered.',
    'The same purchase was charged more than once and the duplicate payment is verified.',
    'Payment was confirmed but the purchased resource, feature, or service was not made available as described.',
    'The delivered item or service is materially different from what was represented before purchase.',
    'Wisdom Points were deducted in error, more than once, or without the corresponding successful access.',
    'Payment was made for an unintended item or destination and the funds can be traced or recovered.',
    'A refund or other remedy is required by applicable law.'
  ]},
  { title: '3. Circumstances that do not automatically qualify', paragraphs: [
    'A completed purchase is not automatically refundable merely because a user changes their mind, no longer needs the material, or chooses not to use access that was correctly delivered. This does not remove any statutory right or remedy where a service is defective, materially misdescribed, not delivered, or otherwise fails to meet a legal standard.',
    'A request may be declined where the transaction cannot be verified, the claimed issue is unsupported by available records, the user has already received the agreed service or remedy, or the request involves fraud or misuse. Sophis Central will consider the facts and will not use this section to exclude rights that cannot lawfully be excluded.'
  ]},
  { title: '4. Paid lecturer-owned materials', paragraphs: [
    'The purchase description, listed price, access conditions, and restrictions shown before payment form part of the transaction. Where access was correctly delivered and the material substantially matches its description, a change of mind or failure to use it does not by itself guarantee a refund.',
    'Where a paid resource is unavailable, inaccessible because of a platform-side error, materially different from its description, or otherwise not supplied as agreed, Sophis Central will investigate and may provide restored access, a replacement, a refund, or another appropriate remedy.',
    'Where a refund is approved, the related sale and revenue-share records may be adjusted or reversed. Lecturer earnings already credited for the refunded sale may be reversed or offset in accordance with the lecturer arrangement and applicable law. Transaction charges that cannot be recovered will be handled under the Financial Policy and applicable agreement.'
  ]},
  { title: '5. Wisdom Points', paragraphs: [
    'Wisdom Points are platform credits, not cash, bank deposits, or a general-purpose payment instrument. Where points were deducted incorrectly or paid access was not delivered, Sophis Central will investigate and, where verified, normally restore the appropriate points to the same account.',
    'A points correction is not automatically a cash refund. A cash refund for a Wisdom Points purchase may be considered where the underlying monetary payment qualifies under this policy or applicable law. Points correctly used for completed access are not ordinarily converted into cash solely because a user changes their mind.',
    'The reference purchase value, current points packages, and points required for a feature are shown in the Financial Policy or at the point of purchase. The actual amount paid and transaction record will be used when assessing an eligible monetary refund.'
  ]},
  { title: '6. How to request a refund', paragraphs: [
    'Contact Sophis Central through the official support or financial-enquiry channel as soon as reasonably possible. Submit the request preferably within seven (7) calendar days of the transaction or of discovering the problem. This is a service guideline, not a deadline that removes any consumer right or legal remedy.',
    'Include your registered email address and Sophis Central user ID; transaction reference, payment date, amount, and currency; the resource, points package, or service involved; a brief explanation and requested remedy; and a receipt or payment notification with sensitive credentials hidden.',
    'Never send passwords, PINs, one-time passcodes, full card numbers, card security codes, or online-banking credentials. These secrets are not required to verify a refund request.'
  ]},
  { title: '7. Review and decision process', paragraphs: [
    'Sophis Central may check payment-provider records, transaction status, account activity, resource-access logs, points history, and relevant communications. We may request reasonable additional information where necessary. Failed or disputed electronic-payment transactions will be handled promptly in cooperation with the relevant payment provider and in accordance with applicable Central Bank of Nigeria requirements and timelines; the general assessment target below does not extend a mandatory payment-system deadline.',
    'We aim to acknowledge a complete request within two (2) business days and normally communicate an assessment outcome within seven (7) business days after receiving the information reasonably required to investigate it. Complex cases, third-party investigations, or circumstances outside our control may take longer; where practicable, we will explain the delay and provide an update.',
    'If a request is declined in whole or in part, we will provide a brief explanation and identify any available next step. Users may request an internal review if they believe relevant information was overlooked.'
  ]},
  { title: '8. How approved refunds are issued', paragraphs: [
    'Approved monetary refunds will normally be initiated to the original payment method or channel where practicable. If that channel cannot receive the refund, Sophis Central will contact the user about a reasonable alternative that can be verified and lawfully used.',
    'We aim to initiate an approved refund within five (5) business days after the decision, subject to required verification. The time for funds to appear in a bank account, card, or wallet depends on the payment provider and financial institution. We will communicate a refund or reversal reference when one is available.',
    'Where the appropriate remedy is restoration of Wisdom Points or correction of an account balance, the adjustment will be recorded against the relevant account and transaction.'
  ]},
  { title: '9. Failed payments, reversals, and chargebacks', paragraphs: [
    'A payment marked as pending, failed, reversed, or disputed may require reconciliation before Sophis Central can confirm the final outcome. Where a debit is unresolved, users should check the transaction status before paying again.',
    'If you initiate a bank or payment-provider dispute, please also notify Sophis Central so that we can investigate and avoid duplicate recovery. Access associated with a reversed or charged-back payment may be reviewed or suspended, subject to a fair process and applicable law.',
    'Bank and payment-provider processing times are outside Sophis Central\'s direct control. This policy does not replace any dispute process available through your bank, payment provider, or a competent consumer-protection authority.'
  ]},
  { title: '10. Contact and escalation', paragraphs: [
    'For refund requests and payment complaints, contact our financial-enquiry address or use the official Contact Us page. Include “Refund Request” in the subject line and provide the transaction reference where available.',
    'If you are dissatisfied with the outcome, you may request an internal review. Nothing in this policy prevents you from using a payment-provider dispute process or seeking assistance from a competent regulator or consumer-protection authority.'
  ]},
  { title: '11. Relationship with other policies and applicable law', paragraphs: [
    'This policy should be read with the Financial Policy, Terms of Use, and Privacy Policy. The Financial Policy explains payment methods, Wisdom Points, lecturer revenue sharing, payouts, and financial records. This Refund Policy provides the more detailed rules for refund eligibility and requests.',
    'This policy is intended to operate consistently with applicable Nigerian consumer-protection and payment rules and any other law that applies to the transaction. If a provision conflicts with a mandatory legal right, that requirement prevails. Nothing here waives a right or remedy that cannot lawfully be excluded.'
  ]},
  { title: '12. Changes to this policy', paragraphs: [
    'Sophis Central may update this policy as its services, payment arrangements, or legal obligations change. The current version will be published with its updated date. Material changes will be communicated where required by law or reasonably necessary.'
  ]}
];

export function RefundPolicyPage() {
  const email = publicContactEmails.financial;
  const emailReady = isConfiguredEmail(email);
  return (
    <main className="min-h-screen bg-[#F3F6FC] px-4 py-8 text-[#1F2937] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <BrandLogo variant="full" tone="dark" />
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2C36D9] hover:text-[#6121D0]"><ArrowLeft size={16} /> Back to home</Link>
        </header>
        <article className="rounded-2xl border border-[#DCE4EF] bg-white p-4 shadow-sm sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Sophis Central</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#091F5B] sm:text-4xl">Refund Policy</h1>
          <p className="mt-3 text-sm text-[#5C6982]">Last Updated: 19 November 2026</p>
          <p className="mt-6 text-sm leading-7 text-[#374151]">This policy explains when a payment issue may qualify for a refund or correction, how to submit a request, and what to expect during review and processing.</p>
          <div className="mt-8 space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="text-lg font-bold text-[#091F5B]">{section.title}</h2>
                {section.paragraphs?.map((paragraph, index) => <p key={index} className="break-words text-sm leading-7 text-[#374151]">{paragraph}</p>)}
                {section.bullets && <ul className="list-disc space-y-2 pl-6 text-sm leading-7 text-[#374151]">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
              </section>
            ))}
          </div>
          <div className="mt-8 rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-4">
            <p className="text-sm font-semibold text-[#091F5B]">Refunds and financial enquiries</p>
            {emailReady ? <a href={"mailto:" + email + "?subject=Refund%20Request"} className="mt-2 inline-block text-sm font-semibold text-[#6121D0] hover:underline">{email}</a> : <p className="mt-2 text-sm text-[#5C6982]">For assistance, please visit our Contact Us page.</p>}
          </div>
          <div className="mt-8 flex flex-wrap gap-4 border-t border-[#DCE4EF] pt-6 text-sm">
            <Link to="/terms" className="font-semibold text-[#6121D0] hover:underline">Terms of Use</Link>
            <Link to="/privacy" className="font-semibold text-[#6121D0] hover:underline">Privacy Policy</Link>
            <Link to="/financial-policy" className="font-semibold text-[#6121D0] hover:underline">Financial Policy</Link>
            <Link to="/cookie-policy" className="font-semibold text-[#6121D0] hover:underline">Cookie Policy</Link>
            <Link to="/contact" className="font-semibold text-[#6121D0] hover:underline">Contact Us</Link>
          </div>
        </article>
        <p className="mt-6 text-center text-xs text-[#71809A]">Sophis Central — Learn. Research. Grow.</p>
      </div>
    </main>
  );
}
