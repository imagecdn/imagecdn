<?php

namespace AppBundle\DependencyInjection;

use Symfony\Component\Config\FileLocator;
use Symfony\Component\Config\Resource\FileResource;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\PrependExtensionInterface;
use Symfony\Component\DependencyInjection\Loader;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;
use Symfony\Component\Yaml\Yaml;

class AppExtension extends Extension implements PrependExtensionInterface
{
    /**
     * @var string
     */
    const DIRECTORY = __DIR__.'/../Resources/config';

    /**
     * {@inheritdoc}
     */
    public function load(array $configs, ContainerBuilder $container)
    {
        $loader = new Loader\YamlFileLoader(
            $container,
            new FileLocator(self::DIRECTORY)
        );
        $loader->load('services.yml');
        $loader->load('parameters.yml');
    }

    /**
     * {@inheritdoc}
     */
    public function prepend(ContainerBuilder $container)
    {
        foreach (['liip_imagine', 'monolog'] as $namespace) {
            $path = self::DIRECTORY."/{$namespace}.yml";
            $container->prependExtensionConfig(
                $namespace,
                Yaml::parse(file_get_contents($path))
            );
            $container->addResource(new FileResource($path));
        }
    }
}
