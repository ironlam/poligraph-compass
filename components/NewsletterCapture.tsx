import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { subscribeToPoligraphNewsletter } from "@/lib/subscribe-api";
import type { BoussoleProfile } from "@/lib/profile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRIVACY_URL = "https://poligraph.fr/mentions-legales#newsletter";

interface Props {
  profile: BoussoleProfile;
  deputyName: string | null;
  deputySlug: string | null;
  postalCode: string | null;
}

export function NewsletterCapture({
  profile,
  deputyName,
  deputySlug,
  postalCode,
}: Props) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isValid = EMAIL_RE.test(email) && consent;

  const onSubmit = async () => {
    if (!isValid || state === "submitting") return;
    setState("submitting");
    const r = await subscribeToPoligraphNewsletter({
      email: email.trim().toLowerCase(),
      deputySlug: deputySlug ?? undefined,
      postalCode: postalCode ?? undefined,
      boussoleProfile: profile,
    });
    if (r.success && r.alreadyConfirmed) {
      setState("success");
      setMessage("Tu es deja abonne, a dimanche !");
    } else if (r.success) {
      setState("success");
      setMessage("Verifie ta boite mail pour confirmer ton inscription.");
    } else {
      setState("error");
      setMessage("Une erreur est survenue. Reessaye.");
    }
  };

  if (state === "success") {
    return (
      <View
        className="mx-6 mt-4 rounded-xl bg-green-50 p-4"
        accessibilityRole="alert"
      >
        <Text className="font-semibold text-green-800">Merci !</Text>
        <Text className="mt-1 text-sm text-green-700">{message}</Text>
      </View>
    );
  }

  return (
    <View className="mx-6 mt-4 rounded-xl bg-white p-4 border border-gray-100">
      <Text className="text-base font-semibold text-gray-900">
        Recois chaque dimanche le recap parlementaire
      </Text>
      <Text className="mt-1 text-sm text-gray-500">
        {deputyName
          ? `Avec un focus sur ton depute ${deputyName}, en 5 minutes de lecture.`
          : "Le resume hebdomadaire des votes, affaires et fact-checks."}
      </Text>

      <TextInput
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (state === "error") setState("idle");
        }}
        placeholder="ton.email@exemple.fr"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Adresse email"
        className="mt-3 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
      />

      <Pressable
        onPress={() => setConsent((c) => !c)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
        accessibilityLabel="J'accepte de recevoir la newsletter Poligraph par email. Je peux me desinscrire a tout moment."
        className="mt-3 flex-row items-start gap-2"
        style={{ minHeight: 44 }}
      >
        <View
          className={`mt-0.5 h-5 w-5 rounded border ${
            consent ? "border-blue-600 bg-blue-600" : "border-gray-400 bg-white"
          }`}
        >
          {consent && (
            <Text className="text-center text-xs leading-5 text-white">v</Text>
          )}
        </View>
        <Text className="flex-1 text-xs text-gray-700 leading-relaxed">
          J{"'"}accepte de recevoir la newsletter Poligraph par email. Je peux
          me desinscrire a tout moment.
        </Text>
      </Pressable>

      <Pressable
        onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
        accessibilityRole="link"
        accessibilityLabel="Voir comment mes donnees sont traitees"
        style={{ minHeight: 44 }}
        className="mt-1 justify-center"
      >
        <Text className="text-xs text-gray-500 underline">
          Voir comment mes donnees sont traitees
        </Text>
      </Pressable>

      <Pressable
        onPress={onSubmit}
        disabled={!isValid || state === "submitting"}
        accessibilityRole="button"
        accessibilityLabel="S'abonner a la newsletter Poligraph"
        accessibilityState={{ disabled: !isValid || state === "submitting" }}
        className={`mt-3 min-h-[48px] flex-row items-center justify-center rounded-xl px-4 py-3 ${
          isValid ? "bg-blue-600 active:bg-blue-700" : "bg-gray-300"
        }`}
      >
        {state === "submitting" ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-base font-semibold text-white">
            S{"'"}abonner
          </Text>
        )}
      </Pressable>

      {state === "error" && message && (
        <Text className="mt-2 text-sm text-red-600">{message}</Text>
      )}
    </View>
  );
}
