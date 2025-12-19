import { Link } from 'react-router-dom';
import { Shield, Star, Users, Award, Heart } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';


export default function About() {
  const { t } = useLanguage();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">{t('about.title')}</h1>
            <p className="text-xl max-w-3xl mx-auto opacity-90">
              {t('about.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4">{t('about.mission')}</h2>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {t('about.missionText')}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4">{t('about.vision')}</h2>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {t('about.visionText')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">{t('about.values')}</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t('about.reliability')}
              </h3>
              <p className="text-gray-600">
                {t('about.reliabilityText')}
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t('about.excellence')}
              </h3>
              <p className="text-gray-600">
                {t('about.excellenceText')}
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t('about.customerFocus')}
              </h3>
              <p className="text-gray-600">
                {t('about.customerFocusText')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t('about.readyToStart')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('about.readyText')}
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-primary-600 hover:bg-primary-50">
              {t('hero.getStarted')}
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}

