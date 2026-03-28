import { View, Text, ScrollView, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-8">
      <Text className="text-lg font-bold text-gray-900 mb-3">{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-sm text-gray-700 leading-5 mb-3">{children}</Text>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row mb-2 pl-2">
      <Text className="text-sm text-gray-400 mr-2">{"•"}</Text>
      <Text className="text-sm text-gray-700 leading-5 flex-1">{children}</Text>
    </View>
  );
}

function Reference({ authors, title, year, onPress }: {
  authors: string;
  title: string;
  year: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? "link" : "none"}
      accessibilityLabel={`${authors}, ${title}, ${year}`}
      className="mb-3"
    >
      <Text className="text-xs text-gray-500 leading-4">
        <Text className="font-bold">{authors}</Text>
        {" "}({year}). <Text className={onPress ? "text-indigo-600 underline" : ""}>{title}</Text>
      </Text>
    </Pressable>
  );
}

export default function Methodology() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="pb-16">
        {/* Header */}
        <View className="px-6 pt-6">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            className="mb-4"
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text className="text-sm text-indigo-500">← Retour</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">
            Notre méthodologie
          </Text>
          <Text className="text-sm text-gray-400 mt-1">
            Comment fonctionne Ma Boussole Parlementaire
          </Text>
        </View>

        <View className="px-6">
          {/* Intro */}
          <Section title="Le principe">
            <Paragraph>
              Ma Boussole Parlementaire compare vos opinions avec les votes réels
              des députés à l'Assemblée nationale. Chaque question du quiz
              correspond à un scrutin public dont le résultat est consultable
              sur le site de l'Assemblée.
            </Paragraph>
            <Paragraph>
              L'outil produit deux résultats : une boussole parlementaire (votre
              positionnement sur deux axes) et un classement de concordance
              (quels élus votent le plus comme vous).
            </Paragraph>
          </Section>

          {/* Compass */}
          <Section title="La boussole : deux axes">
            <Paragraph>
              Votre position est calculée sur deux axes, un modèle validé par
              la recherche en science politique depuis les années 1990.
            </Paragraph>
            <View className="bg-gray-50 rounded-xl p-4 mb-3">
              <Text className="text-sm font-bold text-gray-900 mb-1">
                Axe horizontal : Économie
              </Text>
              <Text className="text-xs text-gray-500">
                Intervention de l'État ← → Libéralisme économique
              </Text>
              <Text className="text-sm font-bold text-gray-900 mt-3 mb-1">
                Axe vertical : Société
              </Text>
              <Text className="text-xs text-gray-500">
                Conservateur ← → Progressiste
              </Text>
            </View>
            <Paragraph>
              Chaque scrutin est assigné à un axe et porte une polarité : voter
              POUR pousse votre position dans une direction, voter CONTRE dans
              l'autre. Votre score sur chaque axe est la moyenne de vos
              réponses (de -1 à +1). Un minimum de 3 réponses par axe est
              requis pour afficher votre position.
            </Paragraph>
          </Section>

          {/* Concordance */}
          <Section title="Le classement : concordance pondérée">
            <Paragraph>
              Le pourcentage affiché pour chaque élu mesure à quel point ses
              votes correspondent aux vôtres, ajusté par un indice de
              confiance. Trois mécanismes travaillent ensemble.
            </Paragraph>

            <Text className="text-sm font-bold text-gray-800 mt-2 mb-1">
              1. Pouvoir discriminant des scrutins
            </Text>
            <Paragraph>
              Tous les votes ne se valent pas. Un vote unanime (tous les
              groupes votent pareil) n'apporte aucune information sur votre
              positionnement. À l'inverse, un vote qui divise clairement la
              gauche et la droite est très informatif. Chaque scrutin reçoit un
              poids entre 0 et 1 selon sa capacité à discriminer.
            </Paragraph>

            <Text className="text-sm font-bold text-gray-800 mt-2 mb-1">
              2. Score de confiance (Wilson)
            </Text>
            <Paragraph>
              Plutôt que d'afficher un pourcentage brut, nous utilisons
              l'intervalle de confiance de Wilson, une méthode statistique
              éprouvée (utilisée notamment par Reddit pour classer les
              commentaires). Ce score pénalise naturellement les résultats
              basés sur peu de données : un élu avec 3 votes en commun ne sera
              pas classé devant un élu avec 15 votes, même si le pourcentage
              brut est plus élevé.
            </Paragraph>

            <Text className="text-sm font-bold text-gray-800 mt-2 mb-1">
              3. Seuil minimum de votes
            </Text>
            <Paragraph>
              Un élu n'apparaît dans le classement que s'il a suffisamment de
              votes en commun avec vos réponses. Ce seuil s'adapte au nombre
              de questions auxquelles vous avez répondu.
            </Paragraph>
          </Section>

          {/* Biases */}
          <Section title="Limites et biais connus">
            <Bullet>
              <Text className="font-bold">Vote sur un texte, pas sur une idée.</Text>
              {" "}Un député peut voter CONTRE une loi sociale non pas parce
              qu'il est contre l'idée, mais parce que le texte ne va pas assez
              loin. Nous sélectionnons les scrutins où le POUR/CONTRE
              correspond le plus clairement à une position idéologique.
            </Bullet>
            <Bullet>
              <Text className="font-bold">Convergence de l'opposition.</Text>
              {" "}L'extrême gauche et l'extrême droite votent parfois toutes
              les deux CONTRE un texte du gouvernement, pour des raisons
              opposées. Les poids discriminants réduisent l'impact de ces votes
              ambigus.
            </Bullet>
            <Bullet>
              <Text className="font-bold">Couverture variable.</Text>
              {" "}Certains députés sont absents lors de nombreux scrutins, ce
              qui rend leur concordance moins fiable. Le score de Wilson et le
              seuil minimum compensent ce biais.
            </Bullet>
          </Section>

          {/* Academic */}
          <Section title="Fondements scientifiques">
            <Paragraph>
              Le modèle à deux axes (économique + culturel) est le cadre
              dominant en science politique européenne. Il a été validé par
              plusieurs décennies de recherche.
            </Paragraph>
            <View className="bg-indigo-50 rounded-xl p-4 mt-1">
              <Reference
                authors="Kitschelt, H."
                title="The Transformation of European Social Democracy"
                year="1994"
              />
              <Reference
                authors="Grunberg, G. & Schweisguth, E."
                title="Libéralisme culturel et libéralisme économique"
                year="1990"
              />
              <Reference
                authors="Tiberj, V."
                title="La politique des deux axes"
                year="2012"
                onPress={() => Linking.openURL("https://shs.cairn.info/revue-francaise-de-science-politique-2012-1-page-71")}
              />
              <Reference
                authors="Chapel Hill Expert Survey"
                title="Party positioning in Europe (1999-2024)"
                year="2024"
                onPress={() => Linking.openURL("https://www.chesdata.eu")}
              />
              <Reference
                authors="Wilson, E. B."
                title="Probable inference, the law of succession, and statistical inference"
                year="1927"
              />
            </View>
          </Section>

          {/* Data */}
          <Section title="Données et transparence">
            <Paragraph>
              Les votes des députés proviennent des données publiques de
              l'Assemblée nationale, collectées et structurées par Poligraph.
              Le code source de l'application est ouvert.
            </Paragraph>
            <Paragraph>
              Aucune donnée personnelle n'est collectée. Vos réponses restent
              sur votre appareil.
            </Paragraph>
          </Section>

          {/* Footer */}
          <View className="mt-10 pt-6 border-t border-gray-100">
            <Text className="text-xs text-gray-400 text-center">
              Un projet de l'Association Sankofa
            </Text>
            <Pressable
              onPress={() => Linking.openURL("https://poligraph.fr")}
              className="mt-2 items-center"
            >
              <Text className="text-xs text-indigo-500">poligraph.fr</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
